import { styleText } from 'node:util'

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace'

export type Logger = Record<LogLevel, (...args: unknown[]) => void>

export const noop = (): void => {}

export const ABSTRACT_LOGGER: Logger = {
  error: noop,
  warn: noop,
  info: noop,
  debug: noop,
  trace: noop,
}

const time = () => styleText('dim', `[${new Date().toLocaleTimeString()}]`)

export const CONSOLE_LOGGER: Logger = {
  error: (...args: any[]) => console.error(`${time()} ${styleText('redBright', '[ERROR]')}`, ...args),
  warn: (...args: any[]) => console.warn(`${time()} ${styleText('yellowBright', '[WARN]')}`, ...args),
  info: (...args: any[]) => console.info(`${time()} ${styleText('greenBright', '[INFO]')}`, ...args),
  debug: (...args: any[]) => console.debug(`${time()} ${styleText('blueBright', '[DEBUG]')}`, ...args),
  trace: (...args: any[]) => console.debug(`${time()} ${styleText('dim', '[TRACE]')}`, ...args),
}
