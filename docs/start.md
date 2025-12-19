# 快速开始 {#start}

本指南将帮助你快速搭建一个 mioki 机器人项目。

## 前置条件 {#prerequisites}

在开始之前，请确保你的环境满足以下条件：

- **Node.js**：版本 >= 20.0.0（推荐使用 LTS 版本）
- **pnpm**：推荐使用 pnpm 作为包管理器（也支持 npm、yarn、bun 等）
- **NapCat**：已部署并运行的 [NapCat](https://napneko.github.io/) 实例

::: tip 💡 现代化运行时
mioki 同样支持 [Bun](https://bun.sh/) 等现代化运行时，使用 Bun 可以获得更快的启动速度和更好的性能。

```bash
bun add mioki
bun run app.ts
```
:::

## 安装 NapCat {#install-napcat}

mioki 依赖 NapCat 作为 QQ 协议端，请先参考 [NapCat 官方文档](https://napneko.github.io/) 完成 NapCat 的安装和配置。

配置 NapCat 时，请确保：

1. 开启 **正向 WebSocket** 服务
2. 记录 WebSocket 服务的 **端口号** 和 **访问令牌（token）**

## 创建项目 {#create-project}

### 初始化项目目录

```bash
# 创建项目目录
mkdir my-bot && cd my-bot

# 初始化 package.json
pnpm init
```

### 安装 mioki

```bash
pnpm add mioki
```

### 创建入口文件

创建 `app.ts`（或 `app.js`）作为机器人入口：

```ts
// app.ts
require('mioki').start({ cwd: __dirname })
```

### 配置 mioki

在 `package.json` 中添加 `mioki` 配置项：

```json
{
  "name": "my-bot",
  "type": "commonjs",
  "scripts": {
    "start": "npx tsx app.ts"
  },
  "dependencies": {
    "mioki": "latest"
  },
  "mioki": {
    "prefix": "#",
    "owners": [123456789],
    "admins": [],
    "plugins": [],
    "log_level": "info",
    "plugins_dir": "plugins",
    "error_push": false,
    "online_push": false,
    "napcat": {
      "protocol": "ws",
      "host": "localhost",
      "port": 3001,
      "token": "your-napcat-token"
    }
  }
}
```

### 配置项说明

| 配置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `prefix` | `string` | `#` | 指令前缀，用于识别框架指令 |
| `owners` | `number[]` | `[]` | 机器人主人 QQ 号列表，拥有最高权限 |
| `admins` | `number[]` | `[]` | 机器人管理员 QQ 号列表 |
| `plugins` | `string[]` | `[]` | 启用的插件列表（插件目录名） |
| `log_level` | `string` | `info` | 日志级别：`debug`、`info`、`warn`、`error` |
| `plugins_dir` | `string` | `plugins` | 插件目录路径 |
| `error_push` | `boolean` | `false` | 是否将未捕获的错误推送给主人 |
| `online_push` | `boolean` | `false` | 机器人上线时是否通知主人 |
| `napcat.protocol` | `string` | `ws` | WebSocket 协议：`ws` 或 `wss` |
| `napcat.host` | `string` | `localhost` | NapCat WebSocket 服务地址 |
| `napcat.port` | `number` | `3001` | NapCat WebSocket 服务端口 |
| `napcat.token` | `string` | - | NapCat 访问令牌 |

## 启动机器人 {#run}

确保 NapCat 实例已启动并登录成功后，运行以下命令启动 mioki：

```bash
pnpm start
```

如果一切正常，你将看到类似以下的输出：

```
========================================
欢迎使用 mioki 💓 v1.0.0
一个基于 NapCat 的插件式 QQ 机器人框架
轻量 * 跨平台 * 插件式 * 热重载 * 注重开发体验
========================================
>>> 正在连接 NapCat 实例: ws://localhost:3001
已连接到 NapCat 实例: NapCat-v1.0.0 机器人昵称(123456789)
>>> 加载 mioki 内置插件: mioki-core
成功加载了 1 个插件，总耗时 10.00 毫秒
mioki v1.0.0 启动完成，祝您使用愉快 🎉️
```

## 内置指令 {#commands}

mioki 内置了一些管理指令（仅主人可用），默认使用 `#` 作为指令前缀：

| 指令 | 说明 |
| --- | --- |
| `#帮助` | 显示帮助信息 |
| `#状态` | 显示框架运行状态 |
| `#插件 列表` | 查看所有插件 |
| `#插件 启用 <插件名>` | 启用指定插件 |
| `#插件 禁用 <插件名>` | 禁用指定插件 |
| `#插件 重载 <插件名>` | 重载指定插件 |
| `#设置 详情` | 查看当前配置 |
| `#设置 加主人 <QQ/AT>` | 添加主人 |
| `#设置 删主人 <QQ/AT>` | 删除主人 |
| `#设置 加管理 <QQ/AT>` | 添加管理员 |
| `#设置 删管理 <QQ/AT>` | 删除管理员 |
| `#退出` | 退出机器人进程 |

## 目录结构 {#structure}

一个典型的 mioki 项目目录结构如下：

```
my-bot/
├── app.ts              # 入口文件
├── package.json        # 项目配置（包含 mioki 配置）
├── plugins/            # 插件目录
│   ├── hello/          # 插件示例
│   │   └── index.ts
│   └── ...
└── logs/               # 日志目录（自动生成）
```

## 下一步 {#next-steps}

- 阅读 [插件开发指南](/plugin) 学习如何编写插件
- 查看 [mioki API 文档](/mioki/api) 了解更多 API
- 探索 [NapCat SDK 文档](/napcat-sdk/) 了解底层能力
