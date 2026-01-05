import { definePlugin } from 'mioki'

interface TempUser {
  triedTimes: number
  verifyNumbers: [number, number, number]
  kickTimer: ReturnType<typeof setTimeout>
  remindTimer: ReturnType<typeof setTimeout> | null
}

const OPTS = ['+', '-'] as const

const DEFAULT_CONFIG = {
  timeout: 3 * 60_000,
  verifyMode: '精确' as '精确' | '模糊',
  maxRetryTimes: 3,
  numberRange: [10, 99] as [number, number],
  lastRemindTime: 60_000 as number | false,
  cmds: {
    on: '#开启验证',
    off: '#关闭验证',
    bypass: '#绕过验证',
    reverify: '#重新验证',
  },
  tips: {
    fallback: '✅ 验证成功，欢迎入群，这个号是机器人，有问题请先查看群公告',
  } as Record<number | 'fallback', string>,
  groups: [] as number[],
}

export default definePlugin({
  name: '进群验证',
  version: '1.0.2',
  priority: 10,
  description: '进群验证',
  setup: async (ctx) => {
    const tempUsers = new Map<string, TempUser>()

    const config = await ctx.createStore(DEFAULT_CONFIG, { __dirname })

    ctx.handle('message.group', async (e) => {
      const text = ctx.text(e)

      const isMatchCmd = Object.values(config.data.cmds).includes(text)
      if (!isMatchCmd) return

      const mentionedUser = await ctx.getMentionedUserId(e)

      if (!ctx.hasRight(e)) return e.reply('不支持小男娘使用喵～')

      switch (text) {
        case config.data.cmds.on: {
          const info = await e.group.getMemberInfo(ctx.bot.uin)

          if (info.role === 'member') {
            return e.reply('权限不足喵，请给我群主/管理员喵～')
          }

          config.update((c) => void (c.groups = ctx.unique([...c.groups, e.group_id])))
          return e.reply('✅ 已开启进群验证喵～')
        }
        case config.data.cmds.off: {
          config.update((c) => {
            const idx = c.groups.indexOf(e.group_id)
            if (idx === -1) return e.reply('进群验证已关闭喵～')
            c.groups.splice(idx, 1)
            return e.reply('✅ 已关闭进群验证喵～')
          })
        }
      }

      if (!mentionedUser) return e.reply('请 @ 需要操作的用户喵～')
      if (!config.data.groups.includes(e.group.group_id)) return e.reply('进群验证未开启喵～')

      switch (text) {
        case config.data.cmds.bypass: {
          clearUser(e.group.group_id, mentionedUser)
          return e.reply(`✅ 验证成功，欢迎入群喵～`)
        }
        case config.data.cmds.reverify: {
          if (ctx.bot.uin === mentionedUser) return e.reply('八嘎！！！')
          if (ctx.hasRight(mentionedUser)) return e.reply('不能对我的主人这么无礼喵～')

          // if (!(await ctx.canBan(e.group.group_id, mentionedUser))) {
          //   return e.reply('权限不足喵，请给我群主喵～')
          // }

          return startVerifyUser(e.group.group_id, mentionedUser)
        }
      }
    })

    ctx.handle('notice.group.increase', async (e) => {
      const { group_id, user_id, group } = e
      const member = await group.getMemberInfo(user_id)

      if (!config.data.groups.includes(group_id)) return
      if (ctx.hasRight(e) || member.role !== 'member') return

      startVerifyUser(group_id, user_id)
    })

    ctx.handle('notice.group.decrease', async (e) => {
      const { group_id, user_id } = e
      if (!config.data.groups.includes(group_id)) return

      if (tempUsers.has(key(group_id, user_id))) {
        clearUser(group_id, user_id)
        await ctx.bot.sendGroupMsg(group_id, `${user_id} 溜掉了，验证流程结束了喵`)
      }
    })

    ctx.handle('message.group.normal', async (e) => {
      const { group_id, sender, group } = e
      const member = await group.pickMember(sender.user_id)
      const { tips, groups, maxRetryTimes } = config.data

      if (ctx.hasRight(e) || member.role !== 'member') return
      if (!groups.includes(group_id)) return

      const user = tempUsers.get(key(group_id, sender.user_id))
      if (!user) return

      const [_, __, result] = user.verifyNumbers
      const msg = ctx.text(e)

      if (msg === String(result)) {
        const tip = tips[group_id] || tips.fallback
        ctx.bot.sendGroupMsg(group_id, tip)
        clearUser(group_id, sender.user_id)
      } else {
        user.triedTimes += 1
        if (user.triedTimes >= maxRetryTimes) {
          clearUser(group_id, sender.user_id)
          await e.reply([ctx.segment.at(sender.user_id), ` ❌ 验证失败，次数达上限了喵，请重新申请喵`])
          await e.group.kick(sender.user_id)
        } else {
          await ctx.bot.sendGroupMsg(group_id, [
            ctx.segment.at(sender.user_id),
            ` ❌ 回答错误，还剩 ${maxRetryTimes - user.triedTimes} 次机会喵`,
          ])
        }
      }
    })

    function startVerifyUser(group_id: number, user_id: number) {
      const user = tempUsers.get(key(group_id, user_id))
      if (user) clearUser(group_id, user_id)

      const { lastRemindTime, timeout, numberRange: range } = config.data
      const [x, y] = [ctx.randomInt(range[0], range[1]), ctx.randomInt(range[0], range[1])]
      const [m, n] = [Math.max(x, y), Math.min(x, y)]
      const operator = ctx.randomItem(OPTS)
      const isPlus = operator === '+'
      const verifyCode = isPlus ? m + n : m - n

      const kickTimer = setTimeout(async () => {
        clearUser(group_id, user_id)
        await ctx.bot.sendGroupMsg(group_id, [ctx.segment.at(user_id), `❌ 验证超时，请重新申请喵`])
        await (await ctx.bot.pickGroup(group_id))?.kick(user_id)
      }, timeout)

      const remindTimer =
        lastRemindTime && lastRemindTime > 0
          ? setTimeout(() => {
              ctx.bot.sendGroupMsg(group_id, [
                ctx.segment.at(user_id),
                ` 进群验证还剩 ${lastRemindTime / 1000} 秒，请发送「${mathFormula}」的运算结果，不听话会被移出群聊喵`,
              ])
            }, timeout - lastRemindTime)
          : null

      tempUsers.set(key(group_id, user_id), {
        triedTimes: 0,
        verifyNumbers: [m, n, verifyCode],
        kickTimer,
        remindTimer,
      })

      const seconds = Math.round(timeout / 1000)
      const mathFormula = `${m}${operator}${n}`

      ctx.bot.sendGroupMsg(group_id, [
        ctx.segment.at(user_id),
        ` 请在「${seconds}」秒内发送「${mathFormula}」的运算结果，不听话会被移出群聊喵`,
      ])
    }

    function clearUser(group_id: number, user_id: number) {
      const mapKey = key(group_id, user_id)
      const user = tempUsers.get(mapKey)

      if (user) {
        user.kickTimer && clearTimeout(user.kickTimer)
        user.remindTimer && clearTimeout(user.remindTimer)
        tempUsers.delete(mapKey)
      }
    }

    function key(group_id: number, user_id: number) {
      return `${group_id}_${user_id}`
    }

    return () => {
      for (const [key] of tempUsers) {
        const [group_id, user_id] = key.split('_').map(Number)
        clearUser(group_id, user_id)
      }
    }
  },
})
