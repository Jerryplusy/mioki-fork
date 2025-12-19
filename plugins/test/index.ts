import { definePlugin } from 'mioki'

export default definePlugin({
  name: 'test',
  version: '1.0.0', // optional
  priority: 10, // optional, default is 10
  description: 'A simple hi plugin', // optional
  async setup(ctx) {
    // ctx.logger.info(`bot: ${ctx.bot.uin}, ${ctx.bot.nickname}`)

    // const res = await ctx.bot.getGroupMemberInfo(608391254, 715785945)
    // ctx.logger.info('group member info:', JSON.stringify(res))

    ctx.handle('notice', async (e) => {
      ctx.logger.info(`received a notice: ${JSON.stringify(e)}`)
    })

    ctx.handle('request.friend', async (e) => {
      ctx.logger.info('收到好友请求：', e.user_id)
      await e.approve()
    })

    ctx.handle('message', async (e) => {
      if (e.raw_message === 'hi') {
        await e.reply('hi from plugin!')
      }

      // e.recall()
      // e.setEssence()
      // e.addReaction('66')
      // const quoteMsg = await e.getQuoteMessage()
      // const text = await ctx.getQuoteText(e)
      // const { uin, pskey, skey, bkn, gtk, cookie } = await ctx.getCookie('qzone.qq.com')
    })

    // ctx.cron('*/3 * * * * *', (ctx, task) => {
    // ctx.logger.warn(`cron task executed at ${task.date}`)
    // ctx.bot.sendPrivateMsg(ctx.botConfig.owners[0], 'hi from cron task!')
    // })

    return () => {
      ctx.logger.info('plugin has been cleaned up!')
    }
  },
})
