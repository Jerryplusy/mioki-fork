<img src="/logo.png" title="mioki" alt="mioki" style="max-width: 160px; border-radius: 4px; border: none;" />

# mioki 简介 {#mioki}

<div style="display: flex; gap: 8px; margin-top: 12px; margin-bottom: 16px;">
  <img src="https://img.shields.io/npm/v/mioki?color=527dec&label=mioki&style=flat-square" title="npm" alt="npm" class="inline"/>
  <img src="https://shields.io/npm/dm/mioki?label=downloads&style=flat-square" title="npm-download" alt="npm-download" class="inline"/>
</div>

`mioki` 是基于 [NapCat](https://napneko.github.io/) 的插件式 [OneBot](https://onebot.dev) 机器人框架，[KiviBot](https://b.viki.moe) 的精神继任者。

mioki 继承了 KiviBot 的轻量、优雅和易用的设计理念，并在此基础上替换了底层通信库为 NapCat SDK，提供了更现代化的 TypeScript 支持和更强大的功能扩展能力。

本项目开发初衷在于提高群活跃氛围、方便群管理，仅供个人娱乐、学习和交流使用，**不得将本项目用于任何非法用途**。

## 为什么选择 mioki {#why}

- 🌟 **KiviBot 继任者**：继承 KiviBot 的优良传统和设计理念
- 🧩 **插件式架构**：支持热插拔插件，运行时动态启用/禁用/重载，方便扩展功能
- 🚀 **基于 NapCat**：利用 NapCat 的强大功能和稳定性
- 💡 **简单易用**：简洁的 API 设计，快速上手
- 📦 **TypeScript 优先**：完整的类型定义，极致的开发体验
- ⏱️ **定时任务**：内置 cron 表达式支持，轻松实现定时任务
- 🛠️ **丰富的工具函数**：提供大量实用工具函数，简化插件开发

更多特性等你探索...

## 插件示例 {#plugin-example}

仅需编写少量代码即可实现丰富功能，比如一个简单的关键词回复插件：

```ts
import { definePlugin } from 'mioki'

export default definePlugin({
  name: 'words',
  version: '1.0.0',
  async setup(ctx) {
    // 处理消息
    ctx.handle('message', async (event) => {
      // 通过原始消息内容进行匹配
      if (event.raw_message === 'hello') {
        // true 代表引用回复
        await event.reply('world', true)
      }

      // 或者更简单的扩展写法
      ctx.match(event, {
        测试: '不支持小处男测试～',
        hello: 'world',
        现在几点: () => new Date().toLocaleTimeString('zh-CN'),
      })
    })
  },
})
```

再比如一个简单的点赞插件：

```ts
import { definePlugin } from 'mioki'

export default definePlugin({
  name: 'like',
  version: '1.0.0',
  async setup(ctx) {
    const { uin, nickname } = ctx.bot

    ctx.logger.info(`插件已加载，当前登录账号：${nickname}（${uin}）`)

    ctx.handle('message.group', async (event) => {
      ctx.match(event, {
        赞我: async () => {
          ctx.logger.info(`收到来自群 ${event.group_id} 的 ${event.user_id} 的点赞请求`)

          await ctx.bot.sendLike(event.user_id, 10)
          await event.addReaction('66')
          await event.reply(['已为您点赞 10 次', ctx.segment.face(66)], true)
        },
      })
    })
  },
})
```
