type Num = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

/**
 * Mioki 上下文对象，包含 Mioki 运行时的信息和方法
 */
export interface MiokiContext {}

export interface MiokiPlugin {
  /** 插件 ID，请保持唯一，一般为插件目录名称，框架内部通过这个识别不同的插件 */
  name: string
  /** 插件版本，一般用于判断插件是否更新，暂只是用于区分 */
  version?: `${Num}.${Num}.${Num}` | `${Num}.${Num}` | (string & {})
  /** 插件加载优先级，默认 100，越小越被优先加载 */
  priority?: number
  /** 插件描述，额外提示信息，暂没有被使用到的地方 */
  description?: string
  /** 插件初始化，返回一个清理函数，用于在插件卸载时清理资源，比如定时器、数据库连接等 */
  setup?: (ctx: MiokiContext) => any
}

/**
 * 定义一个 Mioki 插件
 * @param plugin Mioki 插件对象
 * @returns Mioki 插件对象
 */
export function definePlugin(plugin: MiokiPlugin): MiokiPlugin {
  return plugin
}
