import type { Logger } from './logger'
import type { OneBotEventMap } from './onebot'

export interface MiokiOptions {
  protocol?: 'ws' | 'wss'
  host?: string
  port?: number
  token: string
  logger?: Logger
}

export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never
}[keyof T]

export type OptionalProps<T> = Pick<T, OptionalKeys<T>>

export type ExtractByType<T, K> = T extends { type: K } ? T : never

export interface EventMap extends OneBotEventMap {
  /** WebSocket 连接已打开 */
  'ws.open': void
  /** WebSocket 连接已关闭 */
  'ws.close': void
  /** WebSocket 连接发生错误 */
  'ws.error': Event
  /** 收到 WebSocket 消息 */
  'ws.message': any
}
