import fs from 'node:fs'
import path from 'node:path'
import { hrtime } from 'node:process'
import * as cfg from './config'
import { NapCat } from 'napcat-sdk'
import { version } from '../package.json'
import * as utils from './utils'
import * as actions from './actions'
import { getMiokiLogger } from './logger'
import { BUILTIN_PLUGINS } from './builtins'
import { colors } from 'consola/utils'
import { enablePlugin, ensurePluginDir, getAbsPluginDir, runtimePlugins } from './plugin'

import type { MiokiPlugin } from './plugin'

export interface StartOptions {
  cwd?: string
}

export async function start(options: StartOptions = {}): Promise<void> {
  const { cwd = process.cwd() } = options

  if (cwd !== cfg.BOT_CWD.value) {
    cfg.updateBotCWD(cwd)
  }

  process.title = `mioki v${version}`

  const logger = getMiokiLogger(cfg.botConfig.log_level || 'info')
  const plugin_dir = getAbsPluginDir()

  logger.info(`>>> -> ${colors.bold(colors.cyan('mioki'))} ${colors.bold(colors.green(`v${version}`))} <-`)
  logger.info(`>>> ${colors.yellow(colors.underline(`基于 NapCat 的 TypeScript 🤖️ 机器人框架。`))}`)
  logger.info(`>>> ${colors.italic(`作者: Viki <hi@viki.moe> (https://github.com/vikiboss)`)}`)
  logger.info(`>>> ${colors.italic(`协议: Licensed under MIT License.`)}`)
  logger.info(`>>> ${colors.cyan(`GitHub: https://github.com/vikiboss/mioki`)}`)
  logger.info('>>> ----------------------------------------')
  logger.info(`>>> 工作目录: ${colors.bold(colors.blue(cfg.BOT_CWD.value))}`)
  logger.info(`>>> 插件目录: ${colors.bold(colors.blue(plugin_dir))}`)

  const napcat = new NapCat({
    ...cfg.botConfig.napcat,
    logger,
  })

  napcat.on('napcat.connected', async ({ user_id, nickname }) => {
    logger.info(`>>> 已连接到 NapCat: ${colors.bold(colors.green(nickname))}（${colors.bold(colors.green(user_id))}）`)

    let lastNoticeTime = 0

    process.on('uncaughtException', async (err: any) => {
      const msg = utils.stringifyError(err)
      napcat.logger.error(`>>> uncaughtException, 出错了: ${msg}`)
      if (Date.now() - lastNoticeTime < 1_000) return
      lastNoticeTime = Date.now()
      await actions.noticeMainOwner(napcat, `mioki 发生未捕获异常:\n\n${msg}`).catch(() => {
        napcat.logger.error('>>> 发送未捕获异常通知失败')
      })
    })

    process.on('unhandledRejection', async (err: any) => {
      const msg = utils.stringifyError(err)
      napcat.logger.error(`>>> unhandledRejection, 出错了: ${msg}`)
      if (Date.now() - lastNoticeTime < 1_000) return
      lastNoticeTime = Date.now()
      const date = new Date().toLocaleString()
      await actions.noticeMainOwner(napcat, `【${date}】\n\nmioki 发生未处理异常:\n\n${msg}`).catch(() => {
        napcat.logger.error('>>> 发送未处理异常通知失败')
      })
    })

    ensurePluginDir()

    const plugins = cfg.botConfig.plugins
      .map((p) => ({ dirName: p, absPath: path.resolve(plugin_dir, p) }))
      .filter((p) => {
        if (!fs.existsSync(p.absPath)) {
          napcat.logger.warn(`>>> 插件 ${colors.bold(colors.red(p.dirName))} 不存在，已忽略`)
          return false
        }

        return true
      })

    const failedImportPlugins: [string, string][] = []

    const promises = plugins.map(async ({ absPath, dirName }) => {
      try {
        const plugin = (await utils.jiti.import(absPath, { default: true })) as MiokiPlugin

        if (plugin.name !== dirName) {
          const tip = `>>> 插件目录名 [${colors.bold(colors.yellow(dirName))}] 和插件声明的 name [${colors.bold(colors.yellow(plugin.name))}] 不一致，可能导致重载异常，请修改一致后重启。`
          napcat.logger.warn(tip)
          actions.noticeMainOwner(napcat, tip)
        }
        return plugin
      } catch (e) {
        const err = utils.stringifyError(e)
        failedImportPlugins.push([dirName, err])
        return null
      }
    })

    const start = hrtime.bigint()
    const userPlugins = (await Promise.all(promises)).filter(Boolean) as MiokiPlugin[]
    const sortedUserPlugins = userPlugins.toSorted((prev, next) => (prev.priority ?? 100) - (next.priority ?? 100))

    if (failedImportPlugins.length) {
      const tip = `>>> ${colors.bold(colors.red(failedImportPlugins.length))} 个插件加载失败: \n\n${failedImportPlugins.map(([dirName, err]) => `${dirName}: ${err}`).join('\n\n')}`
      napcat.logger.warn(tip)
      actions.noticeMainOwner(napcat, tip)
    }

    // 按 priority 分组
    const pluginGroups = new Map<number, MiokiPlugin[]>()
    for (const plugin of sortedUserPlugins) {
      const priority = plugin.priority ?? 100
      if (!pluginGroups.has(priority)) {
        pluginGroups.set(priority, [])
      }
      pluginGroups.get(priority)!.push(plugin)
    }

    // 按 priority 排序分组
    const sortedGroups = Array.from(pluginGroups.entries()).toSorted(([a], [b]) => a - b)

    const failedEnablePlugins: [string, string][] = []

    try {
      // 加载内置插件
      napcat.logger.info(`>>> 加载内置插件: ${BUILTIN_PLUGINS.map((p) => colors.bold(colors.cyan(p.name))).join(', ')}`)
      await Promise.all(BUILTIN_PLUGINS.map((p) => enablePlugin(napcat, p, 'builtin')))

      // 按优先级分组并行加载用户插件，相同优先级的插件可以并行加载
      for (const [_, plugins] of sortedGroups) {
        await Promise.all(
          plugins.map(async (p) => {
            try {
              await enablePlugin(napcat, p, 'external')
            } catch (e) {
              failedEnablePlugins.push([p.name, utils.stringifyError(e)])
            }
          }),
        )
      }
    } catch (e: any) {
      napcat.logger.error(e?.message)
      await actions.noticeMainOwner(napcat, e?.message).catch(() => {
        napcat.logger.error('>>> 发送插件启用失败通知失败')
      })
    }

    const end = hrtime.bigint()
    const costTime = Math.round(Number(end - start)) / 1_000_000
    const failedCount = failedImportPlugins.length + failedEnablePlugins.length

    const failedInfo =
      failedCount > 0
        ? `${colors.bold(colors.red(failedCount))} 个失败 (导入 ${colors.bold(colors.red(failedImportPlugins.length))}，启用 ${colors.bold(colors.red(failedEnablePlugins.length))})。`
        : ''

    napcat.logger.info(
      `>>> 成功加载了 ${colors.bold(colors.green(runtimePlugins.size))} 个插件。${failedInfo ? failedInfo : ''}总耗时 ${colors.bold(colors.green(costTime.toFixed(2)))} ms`,
    )

    napcat.logger.info(colors.bold(colors.green(`>>> mioki v${version} 启动完成！祝您使用愉快！🎉️`)))

    if (cfg.botConfig.online_push) {
      await actions.noticeMainOwner(napcat, `✅ mioki v${version} 已就绪`).catch((err) => {
        napcat.logger.error(`>>> 发送就绪通知失败: ${utils.stringifyError(err)}`)
      })
    }
  })

  await napcat.run()
}
