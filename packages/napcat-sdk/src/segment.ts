import type { NormalizedElement } from './onebot'

function createDataSegment<T extends string, D>(type: T, data: D) {
  return { type, ...data }
}

/**
 * 消息片段构造器
 */
export const segment = {
  /** 创建一个文本消息片段 */
  text: (text: string): NormalizedElement => createDataSegment('text', { text }),
  /** 创建一个艾特消息片段 */
  at: (qq: 'all' | (string & {})): NormalizedElement => createDataSegment('at', { qq }),
  /** 创建一个回复消息片段 */
  reply: (id: string): NormalizedElement => createDataSegment('reply', { id }),
  /** 创建一个图片消息片段 */
  image: (file: string): NormalizedElement => createDataSegment('image', { file }),
  /** 创建一个 QQ 表情消息片段 */
  face: (id: number): NormalizedElement => createDataSegment('face', { id }),
  /** 创建一个语音消息片段 */
  record: (file: string): NormalizedElement => createDataSegment('record', { file }),
  /** 创建一个视频消息片段 */
  video: (file: string): NormalizedElement => createDataSegment('video', { file }),
}
