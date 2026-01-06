import { definePlugin } from 'mioki'

export default definePlugin({
  name: 'qzone',
  async setup(ctx) {
    ctx.handle('message', async (e) => {
      if (!ctx.isOwner(e)) return

      if (e.raw_message.startsWith('发说说')) {
        const content = e.raw_message.replace('发说说', '').trim()
        const { legacyCookie } = await ctx.getCookie('qzone.qq.com')
        const success = await sendQzonePost(legacyCookie, content)
        await e.reply(success ? '说说发布成功' : '说说发布失败')
      }
    })
  },
})

async function sendQzonePost(qzone_ck: string, content: string, isPrivate = false) {
  try {
    const UA_iOS_QQ = 'Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Mobile/15E148 QQ/8.9.28.635'

    const qq = /uin=o?(\d+);/.exec(qzone_ck)?.[1] || ''
    const pskey = /p_skey=([^;]+);/.exec(qzone_ck)?.[1] || ''
    const postData = { con: content.trim(), ugc_right: isPrivate ? '64' : '1', hostuin: qq }

    const proxyApi = 'https://user.qzone.qq.com/proxy/domain'
    const qzonePostApi = `${proxyApi}/taotao.qzone.qq.com/cgi-bin/emotion_cgi_publish_v6?g_tk=${qq_encrypt(pskey)}`

    const data = await (
      await fetch(qzonePostApi, {
        method: 'POST',
        body: new URLSearchParams(postData),
        headers: {
          Cookie: qzone_ck,
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'User-Agent': UA_iOS_QQ,
        },
      })
    ).text()

    const code = /"code":\s?(-?[0-9]+)/.exec(data)
    return code && code.length && +code[1] >= 0
  } catch (e) {
    return false
  }
}

function qq_encrypt(str: string): number {
  let bkn = 5381

  for (const c of str) {
    bkn += (bkn << 5) + c.charCodeAt(0)
  }

  return bkn & 2147483647
}
