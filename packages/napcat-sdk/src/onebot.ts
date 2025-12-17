export interface MediaProps {
  url: string
  path: string
  file: (string & {}) | 'marketface'
  file_id: string
  file_size: string
  file_unique: string
}

export type RecvElement =
  | { type: 'text'; text: string }
  | { type: 'at'; qq: 'all' | (string & {}) }
  | { type: 'reply'; id: string }
  | { type: 'face'; id: number }
  | ({ type: 'image'; summary?: string; sub_type?: string } & MediaProps)
  | ({ type: 'record' } & MediaProps)
  | ({ type: 'video' } & MediaProps)
  | { type: 'rps'; result: string }
  | { type: 'dice'; result: string }
  | { type: 'shake' }
  | { type: 'poke' }
  | { type: 'share' }
  | { type: 'location' }
  | { type: 'forward'; id: string; content: [] }
  | { type: 'json'; data: string }
  | ({ type: 'file' } & MediaProps)
  | { type: 'markdown' }
  | { type: 'lightapp' }

export type SendElement =
  | { type: 'text'; text: string }
  | { type: 'at'; qq: 'all' | (string & {}) | number }
  | { type: 'reply'; id: string }
  | {
      type: 'mface'
      id: number
      key: string
      emoji_id: string
      emoji_package_id: string
      summary?: string
    }
  | { type: 'face'; id: number }
  | { type: 'bface'; id: number }
  | { type: 'image'; file: string; name?: string; summary?: string; sub_type?: string }
  | { type: 'video'; file: string; name?: string; thumb?: string }
  | { type: 'record'; file: string; name?: string }
  | { type: 'contact'; sub_type: 'qq' | 'group'; id: string }
  | { type: 'poke' }
  | ({ type: 'music' } & (
      | { platform: 'qq' | '163' | 'kugou' | 'migu' | 'kuwo'; id: string }
      | { platform: 'custom'; url: string; audio: string; title: string; image?: string; singer?: string }
    ))
  | { type: 'forward'; id: string }
  | ({
      type: 'node'
      user_id?: string
      nickname?: string
    } & ({ id: string } | { content: Exclude<SendElement, { type: 'node' }>[] }))
  | { type: 'json'; data: string }
  | {
      type: 'file'
      name?: string
      file: string
    }
  | { type: 'markdown' }
  | { type: 'lightapp' }

export type WrapData<T extends { type: string }> = { type: T['type']; data: Omit<T, 'type'> }
export type FlattenData<T extends { type: string }> = T extends { data: infer U } ? U & { type: T['type'] } : never

export type NormalizedElementToSend = WrapData<SendElement>
export type Sendable = string | SendElement

export type PostType = 'meta_event' | 'message' | 'message_sent' | 'notice' | 'request'
export type MetaEventType = 'heartbeat' | 'lifecycle'
export type MessageType = 'private' | 'group'

export type EventBase<T extends PostType, U extends object> = U & { time: number; self_id: number; post_type: T }

export type MetaEventBase<T extends MetaEventType, U extends object> = U &
  EventBase<'meta_event', { meta_event_type: T }>

export type HeartbeatMetaEvent = MetaEventBase<
  'heartbeat',
  { status: { online: boolean; good: boolean }; interval: number }
>

export type LifecycleMetaEvent = MetaEventBase<
  'lifecycle',
  {
    sub_type: 'connect'
    // sub_type: 'connect' | 'disable' | 'enable'
  }
>

export type MetaEvent = HeartbeatMetaEvent | LifecycleMetaEvent

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
      message: RecvElement[]
      reply: Reply
    }
  >

export type PrivateMessageEvent = MessageEventBase<
  'private',
  {
    user_id: number
    sub_type: 'friend' | 'group' | 'group_self' | 'other'
    target_id: number
    friend: {
      user_id: number
      nickname: string
      sendMsg: (sendable: Sendable | Sendable[]) => Promise<{ message_id: string }>
    }
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
    sub_type: 'normal' | 'notice'
    group: {
      group_id: number
      group_name: string
      sendMsg: (sendable: Sendable | Sendable[]) => Promise<{ message_id: string }>
    }
    sender: {
      user_id: number
      nickname: string
      card: string
      role: 'owner' | 'admin' | 'member'
    }
  }
>

export type MessageEvent = PrivateMessageEvent | GroupMessageEvent

export const NAPCAT_NOTICE_NOTIFY_MAP: Record<string, { notice_type: string; sub_type: string }> = {
  poke: {
    notice_type: 'friend',
    sub_type: 'poke',
  },
  input_status: {
    notice_type: 'friend',
    sub_type: 'input',
  },
  profile_like: {
    notice_type: 'friend',
    sub_type: 'like',
  },
  title: {
    notice_type: 'group',
    sub_type: 'title',
  },
}

export const NAPCAT_NOTICE_EVENT_MAP: Record<string, { notice_type: string; sub_type: string }> = {
  friend_add: {
    notice_type: 'friend',
    sub_type: 'increase',
  },
  friend_recall: {
    notice_type: 'friend',
    sub_type: 'recall',
  },
  offline_file: {
    notice_type: 'friend',
    sub_type: 'offline_file',
  },
  client_status: {
    notice_type: 'client',
    sub_type: 'status',
  },
  group_admin: {
    notice_type: 'group',
    sub_type: 'admin',
  },
  group_ban: {
    notice_type: 'group',
    sub_type: 'ban',
  },
  group_card: {
    notice_type: 'group',
    sub_type: 'card',
  },
  group_upload: {
    notice_type: 'group',
    sub_type: 'upload',
  },
  group_decrease: {
    notice_type: 'group',
    sub_type: 'decrease',
  },
  group_increase: {
    notice_type: 'group',
    sub_type: 'increase',
  },
  group_msg_emoji_like: {
    notice_type: 'group',
    sub_type: 'reaction',
  },
  essence: {
    notice_type: 'group',
    sub_type: 'essence',
  },
  group_recall: {
    notice_type: 'group',
    sub_type: 'recall',
  },
}

type ToMessageSent<T extends MessageEvent> = Omit<T, 'post_type' | 'group' | 'friend' | 'reply'> & {
  post_type: 'message_sent'
}

export interface OneBotEventMap {
  /** 元事件，通常与 OneBot 服务端状态相关 */
  meta_event: MetaEvent

  /** 元事件 - 心跳事件，确认服务端在线状态 */
  'meta_event.heartbeat': HeartbeatMetaEvent

  /** 元事件 - 生命周期，服务端状态变化 */
  'meta_event.lifecycle': LifecycleMetaEvent
  /** 元事件 - 生命周期 - 连接成功 */
  'meta_event.lifecycle.connect': LifecycleMetaEvent
  // 'meta_event.lifecycle.disable': LifecycleMetaEvent
  // 'meta_event.lifecycle.enable': LifecycleMetaEvent

  /** 消息事件，包含私聊和群消息 */
  message: MessageEvent

  /** 消息事件 - 私聊消息 */
  'message.private': PrivateMessageEvent
  /** 消息事件 - 私聊消息 - 好友私聊 */
  'message.private.friend': PrivateMessageEvent
  /** 消息事件 - 私聊消息 - 群临时会话 */
  'message.private.group': PrivateMessageEvent
  // 'message.private.group_self': PrivateMessageEvent
  // 'message.private.other': PrivateMessageEvent

  /** 消息事件 - 群消息 */
  'message.group': GroupMessageEvent
  /** 消息事件 - 群消息 - 普通消息 */
  'message.group.normal': GroupMessageEvent
  // 'message.group.notice': GroupMessageEvent

  message_sent: ToMessageSent<MessageEvent>

  /* 发送消息事件 - 私聊消息 */
  'message_sent.private': ToMessageSent<PrivateMessageEvent>
  /* 发送消息事件 - 私聊消息 - 好友私聊 */
  'message_sent.private.friend': ToMessageSent<PrivateMessageEvent>
  /* 发送消息事件 - 私聊消息 - 群临时会话 */
  'message_sent.private.group': ToMessageSent<PrivateMessageEvent>
  // 'message_sent.private.group_self': MessageToMessageSent<PrivateMessageEvent>
  // 'message_sent.private.other': MessageToMessageSent<PrivateMessageEvent>

  /* 发送消息事件 - 群消息 */
  'message_sent.group': ToMessageSent<GroupMessageEvent>
  /* 发送消息事件 - 群消息 - 普通消息 */
  'message_sent.group.normal': ToMessageSent<GroupMessageEvent>
  // 'message.group.notice': MessageToMessageSent<GroupMessageEvent>

  /** 请求事件 */
  request: EventBase<'request', any>

  /** 请求事件 - 好友请求 */
  'request.friend': EventBase<'request', any>

  /** 请求事件 - 群请求 */
  'request.group': EventBase<'request', any>
  /** 请求事件 - 他人加群请求，当机器人是群主或管理员时收到 */
  'request.group.add': EventBase<'request', any>
  /** 请求事件 - 邀请加群请求，他人邀请机器人加入群时收到 */
  'request.group.invite': EventBase<'request', any>

  /** 通知事件 */
  notice: EventBase<'notice', any>

  /** 通知事件 - 好友相关通知 */
  'notice.friend': EventBase<'notice', any>
  /** 通知事件 - 好友增加 */
  'notice.friend.increase': EventBase<'notice', any>
  /** 通知事件 - 好友减少 */
  'notice.friend.decrease': EventBase<'notice', any>
  /** 通知事件 - 好友备注变更 */
  'notice.friend.recall': EventBase<'notice', any>
  /** 通知事件 - 好友戳一戳 */
  'notice.friend.poke': EventBase<'notice', any>
  /** 通知事件 - 好友点赞 */
  'notice.friend.like': EventBase<'notice', any>
  /** 通知事件 - 好友输入状态 */
  'notice.friend.input': EventBase<'notice', any>

  // 'notice.friend.offline_file': EventBase<'notice', any>
  // 'notice.client.status': EventBase<'notice', any>

  /** 通知事件 - 群相关通知 */
  'notice.group': EventBase<'notice', any>
  /** 通知事件 - 群成员增加 */
  'notice.group.increase': EventBase<'notice', any>
  /** 通知事件 - 群成员减少 */
  'notice.group.decrease': EventBase<'notice', any>
  /** 通知事件 - 群管理员变更 */
  'notice.group.admin': EventBase<'notice', any>
  /** 通知事件 - 群成员被禁言 */
  'notice.group.ban': EventBase<'notice', any>
  /** 通知事件 - 群戳一戳 */
  'notice.group.poke': EventBase<'notice', any>
  /** 通知事件 - 群头衔变更 */
  'notice.group.title': EventBase<'notice', any>
  /** 通知事件 - 群名片变更 */
  'notice.group.card': EventBase<
    'notice',
    {
      notice_type: 'group'
      sub_type: 'card'
      group_id: number
      user_id: number
      card_new: string
      card_old: string
    }
  >
  /** 通知事件 - 群公告变更 */
  'notice.group.recall': EventBase<'notice', any>
  /** 通知事件 - 群上传文件 */
  'notice.group.upload': EventBase<'notice', any>
  /** 通知事件 - 给群消息添加反应 Reaction */
  'notice.group.reaction': EventBase<'notice', any>
  /** 通知事件 - 群精华消息变更 */
  'notice.group.essence': EventBase<'notice', any>
}
