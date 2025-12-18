import fs from 'node:fs'
import path from 'node:path'
import { dayjs } from './utils'
import { BOT_CWD, botConfig } from './config'
import { stripAnsi, ColorName, colors } from 'consola/utils'
import { createConsola, LogLevels, ConsolaInstance } from 'consola/core'

import type { LogLevel } from 'napcat-sdk'

const LEVEL_MAP: Record<number, { name: string; color: ColorName }> = {
  0: { name: 'ERROR', color: 'red' },
  1: { name: 'WARN', color: 'yellow' },
  2: { name: 'LOG', color: 'white' },
  3: { name: 'INFO', color: 'green' },
  4: { name: 'DEBUG', color: 'blue' },
  5: { name: 'TRACE', color: 'gray' },
}

export const logger: ConsolaInstance = getMiokiLogger(botConfig.log_level || 'info')

/**
 * 获取日志文件名
 */
export function getLogFilePath(type: string = ''): string {
  const startTime = dayjs().format('YYYY-MM-DD_HH-mm-ss')
  return path.join(BOT_CWD.value, `logs/${startTime}${type ? '.' + type : ''}.log`)
}

export function getMiokiLogger(level: LogLevel): ConsolaInstance {
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
          const message = stripAnsi(logObj.message || logObj.args?.join(' ') || '')
          const prefix = `[${logObj.date.toISOString()}] [${LEVEL_MAP[logObj.level].name}] ${logObj.tag ? `[${logObj.tag}] ` : ''}`
          const line = `${prefix}${message}`
          fs.appendFileSync(logFile, line + '\n')
        },
      },
      {
        log: (logObj) => {
          const message = logObj.message || logObj.args?.join(' ') || ''
          const prefix =
            colors.gray(`[${logObj.date.toLocaleTimeString('zh-CN')}]`) +
            ' ' +
            colors.bold(colors[LEVEL_MAP[logObj.level].color](LEVEL_MAP[logObj.level].name)) +
            ' ' +
            (logObj.tag ? colors.dim(`[${logObj.tag}] `) : '')
          const line = `${prefix}${message}`

          if (logObj.level <= LogLevels['info']) {
            console.log(line)
          } else if (logObj.level === LogLevels['warn']) {
            console.warn(line)
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
