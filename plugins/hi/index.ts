import { definePlugin } from 'mioki'

export default definePlugin({
  name: 'hi',
  setup(ctx) {
    console.log('plugin has been set up!')

    ctx.handle('message.group', async (e) => {
      if (e.raw_message === 'hi') {
        await e.reply('hi from plugin!')
      }
    })

    ctx.cron('*/1 * * * *', (ctx, now) => {
      console.log(`cron task executed at ${now}`)
      ctx.bot.sendGroupMsg(123456789, 'hi from cron task!')
    })

    return () => {
      console.log('plugin has been cleaned up!')
    }
  },
})
