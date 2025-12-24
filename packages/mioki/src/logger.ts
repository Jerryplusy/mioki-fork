import fs from 'node:fs'
import util from 'node:util'
import path from 'node:path'
import { dayjs } from './utils'
import { BOT_CWD, botConfig } from './config'
import { stripAnsi, ColorName, colors } from 'consola/utils'
import { createConsola, LogLevels } from 'consola/core'

import type { Logger, LogLevel } from 'napcat-sdk'

const LEVEL_MAP: Record<number, { name: string; color: ColorName }> = {
  0: { name: 'ERROR', color: 'red' },
  1: { name: 'WARN', color: 'yellow' },
  2: { name: 'LOG', color: 'white' },
  3: { name: 'INFO', color: 'green' },
  4: { name: 'DEBUG', color: 'blue' },
  5: { name: 'TRACE', color: 'gray' },
}

export const logger: Logger = getMiokiLogger(botConfig.log_level || 'info')

/**
 * 获取日志文件名
 */
export function getLogFilePath(type: string = ''): string {
  const startTime = dayjs().format('YYYY-MM-DD_HH-mm-ss')
  return path.join(BOT_CWD.value, `logs/${startTime}${type ? '.' + type : ''}.log`)
}

export function getMiokiLogger(level: LogLevel): Logger {
  const logDir = path.join(BOT_CWD.value, 'logs')

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }

  const logFile = getLogFilePath()

  return createConsola({
    level: LogLevels[level],
    defaults: {
      tag: 'mioki',
    },
    reporters: [
      {
        log: (logObj) => {
          const message = stripAnsi(
            logObj.message ||
              logObj.args
                ?.map((e) => (typeof e === 'string' ? e : util.inspect(e, { colors: true, depth: null })))
                .join('') ||
              '',
          )

          const prefix = `[${logObj.date.toISOString()}] [${LEVEL_MAP[logObj.level].name}] ${logObj.tag ? `[${logObj.tag}]` : ''}`
          const line = `${prefix}${message}`
          fs.appendFileSync(logFile, line + '\n')
        },
      },
      {
        log: (logObj) => {
          const time = colors.gray(`[${logObj.date.toLocaleTimeString('zh-CN')}]`)
          const level = colors.bold(colors[LEVEL_MAP[logObj.level].color](LEVEL_MAP[logObj.level].name))
          const tag = logObj.tag ? colors.dim(`[${logObj.tag}]`) : ''

          const message =
            logObj.message ||
            logObj.args
              ?.map((e) => (typeof e === 'string' ? e : util.inspect(e, { colors: true, depth: null })))
              .join(' ') ||
            ''

          const line = `${time} ${level} ${tag} ${message}`

          if (logObj.level <= LogLevels['error']) {
            console.error(line)
          } else if (logObj.level === LogLevels['warn']) {
            console.warn(line)
          } else if (logObj.level === LogLevels['log']) {
            console.log(line)
          } else if (logObj.level === LogLevels['info']) {
            console.info(line)
          } else {
            console.debug(line)
          }
        },
      },
    ],
    formatOptions: {
      colors: true,
      compact: true,
      date: true,
    },
  })
}
