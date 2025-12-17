export type MessageElement =
  | { type: 'text'; text: string }
  | { type: 'at'; qq: 'all' | (string & {}) }
  | { type: 'reply'; id: string }
  | {
      type: 'image'
      data: {
        file: string
        file_id: string
        url: string
        path: string
        file_size: string
        file_unique: string
        summary?: string
        sub_type?: string
      }
    }
  | { type: 'face'; id: number }
  | { type: 'record'; file: string }
  | { type: 'video'; file: string }

export type NormalizedElementToSend =
  | { type: 'text'; data: { text: string } }
  | { type: 'at'; data: { qq: 'all' | (string & {}) } }
  | { type: 'reply'; data: { id: string } }
  | {
      type: 'image'
      data: {
        name?: string
        summary?: string
        sub_type?: string
        file: string
      }
    }
  | { type: 'face'; data: { id: number } }
  | { type: 'bface'; data: { id: number } }
  | { type: 'record'; data: { file: string } }
  | { type: 'video'; data: { file: string } }

type FlattenData<T extends { type: string }> = T extends { data: infer U } ? U & { type: T['type'] } : never

export type NormalizedElement = FlattenData<NormalizedElementToSend>

export type Sendable = string | NormalizedElement

export type PostType = 'meta_event' | 'message'

export type EventBase<T extends PostType, U extends object> = U & {
  time: number
  self_id: number
  post_type: T
}

export type MetaEventType = 'heartbeat' | 'lifecycle'

export type MetaEventBase<T extends MetaEventType, U extends object> = U &
  EventBase<'meta_event', { meta_event_type: T }>

export type MetaEvent =
  | MetaEventBase<'heartbeat', { status: { online: boolean; good: boolean }; interval: number }>
  | MetaEventBase<'lifecycle', { sub_type: 'connect' | 'disconnect' }>

export type MessageType = 'private' | 'group'

type Reply = (sendable: Sendable | Sendable[], reply?: boolean) => Promise<{ message_id: string }>

export type MessageEventBase<T extends MessageType, U extends object> = U &
  EventBase<
    'message',
    {
      message_type: T
      message_seq: number
      real_id: number
      real_seq: number
      raw_message: string
      message: MessageElement[]
      reply: Reply
    }
  >

export type PrivateMessageEvent = MessageEventBase<
  'private',
  {
    user_id: number
    message: string
    sub_type: 'friend'
    target_id: number
    sender: {
      user_id: number
      nickname: string
    }
  }
>

export type GroupMessageEvent = MessageEventBase<
  'group',
  {
    group_id: number
    group_name: string
    user_id: number
    message: string
    sub_type: 'normal'
    sender: {
      user_id: number
      nickname: string
      card: string
      role: 'owner' | 'admin' | 'member'
    }
  }
>

export type MessageEvent = PrivateMessageEvent | GroupMessageEvent

export interface OneBotEventMap {
  meta_event: MetaEvent
  message: MessageEvent
  'message.private': PrivateMessageEvent
  'message.group': GroupMessageEvent
}
