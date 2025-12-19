# NapCat SDK for TypeScript

> 更多详情请查看 [GitHub](https://github.com/vikiboss/mioki)

### 快速开始

NapCat SDK for TypeScript 允许开发者轻松地将 NapCat 的功能集成到他们的 TypeScript 应用中。该 SDK 提供了一套工具和实用程序，可以无缝地与 NapCat 服务进行交互。

### 安装

你可以通过 npm 安装 NapCat SDK。在终端中运行以下命令：

```bash
pnpm install napcat-sdk
```

### 快速开始

要连接到 NapCat，你需要创建一个 NapCat 客户端实例。这是一个简单的示例：

```typescript
import { NapCat, segment } from 'napcat-sdk'

// 1. 创建一个新的 NapCat 客户端实例
const napcat = new NapCat({
  // protocol: 'ws', // 可选：指定协议（默认为 'ws'）
  // host: 'localhost', // 可选：指定自定义主机
  // port: 3333, // 可选：指定自定义端口
  token: 'here-your-auth-token', // 必填：你的认证令牌
})

// 2. 订阅事件
napcat.on('message', (event) => {
  // reply 是一个快速发送消息的方法，可选带回复标记
  event.reply('Hello from NapCat SDK!', true) // true 表示带回复标记

  // 你可以通过 `napcat.api()` 方法调用所有 NapCat API
  const { value } = await napcat.api<{ value: unknown }>('awesome-function')
})

// 你也可以监听特定的消息子类型
napcat.on('message.group', async (event) => {
  // 消息事件提供了一些可用的方法
  await event.setEssence(event.message_id)
  await event.recall()

  // 你也可以与群实例交互来执行一些操作
  await event.group.setTitle(114514, 'Special Title')

  // 要发送的消息可以是消息段数组
  await event.reply(['Hi! ', napcat.segment.face(66)])

  // 或者直接使用 napcat 发送消息
  await napcat.sendGroupMsg(event.group_id, 'Hello Group!')
})

// 更多事件...
napcat.on('notice', (event) => {})
napcat.on('notice.group', (event) => {})
napcat.on('request', (event) => {})
napcat.on('request.group.invite', (event) => {
  // 同意群邀请请求，或使用 event.reject() 拒绝
  event.approve() 
})

// 需要时关闭连接
napcat.close() 
```

## License

MIT License © 2025-PRESENT Viki
