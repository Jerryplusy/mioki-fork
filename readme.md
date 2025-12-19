# mioki

💓 一个插件式的 NapCat OneBot 框架，KiviBot 的精神继任者。

<img src="./docs/public/demo.png" title="demo" alt="demo" style="max-width: 640px; border-radius: 4px; border: none;" />

> [!注意]
> 本项目仍在积极开发中，使用需自担风险。

本仓库包含两个包：

- [packages/mioki](./packages/mioki)：一个简洁的框架，轻松构建 NapCat 机器人。
- [packages/napcat-sdk](./packages/napcat-sdk)：用于与 NapCat 交互的 TypeScript SDK。


## 环境要求

你需要在你的机器上安装 [Node.js](https://nodejs.org/)（v20.11+）和 [Docker](https://www.docker.com/)。

它将端口 3001 映射到 3333，mioki 默认使用 `3333` 端口连接 NapCat WebSocket 服务器。

使用 Docker 运行 NapCat：

```bash
docker run -d \
  -e NAPCAT_GID=$(id -g) \
  -e NAPCAT_UID=$(id -u) \
  -p 3333:3001 \
  -p 6099:6099 \
  --name napcat \
  --restart=always \
  mlikiowa/napcat-docker:latest
```

> 注：镜像大小超过 500 MB，下载可能需要一些时间。

访问 http://localhost:6099，导航到「网络设置」添加新的 WebSocket 服务器，在 Docker 中使用 `3001` 端口和 `0.0.0.0` 主机。添加后请确保启用它。请记住你设置的 token，你需要用它来连接 mioki 和 NapCat。

<img src="./docs/public/napcat-ws-config.png" title="napcat-websocket" alt="napcat-websocket" style="width: 300px; max-width: 300px; border-radius: 4px; border: none;" />

## mioki 使用方法

### 1. 创建 mioki 项目

```bash
mkdir bot && cd bot
npm init -y && npm install mioki
echo "require('mioki').start({ cwd: __dirname })" > app.ts
```

### 2. 配置 mioki

更新 `package.json`，添加 `mioki` 字段来配置 mioki 选项。

```json
{
  "mioki": {
    "owners": [114514],
    "admins": [],
    "plugins": [],
    "log_level": "info",
    "online_push": true,
    "napcat": {
      "protocol": "ws",
      "host": "localhost",
      "port": 3333,
      "token": "your-napcat-token",
    }
  }
}
```

### 3. 运行机器人

```bash
# 或者使用 `bun app.ts`、`tsx app.ts` 等
node app.ts 
```

## NapCat SDK for TypeScript 使用方法

如果你想在 TypeScript 项目中直接使用 NapCat SDK，可以按照以下说明操作。

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
