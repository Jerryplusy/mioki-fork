import sharp from 'sharp'
import { Suspense, use } from 'react'
import { fs, path, wait } from 'mioki'
import { renderToReadableStream } from 'react-dom/server'

import type * as React from 'react'
import type { Arrayable } from 'mioki'
import type * as puppeteer from 'puppeteer-core'
import type { BrowserPool } from './browser-pool'

export interface RenderUrlOptions {
  pc?: boolean
  wait?: number
  timeout?: number
  userAgent?: string
  waitUntil?: Arrayable<puppeteer.PuppeteerLifeCycleEvent>
  selector?: string
  width?: number
  maxHeight?: number
  colorMode?: 'light' | 'dark' | 'auto'
  deviceScaleFactor?: number
}

const UA_PC =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
const UA_MOBILE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'

export async function renderUrl(bp: BrowserPool, url: string, options: RenderUrlOptions = {}) {
  const {
    pc = false,
    selector = 'body',
    colorMode = 'auto',
    userAgent = UA_PC,
    wait: delayTime = 3_000,
    waitUntil,
    timeout = 6_000,
    deviceScaleFactor = 2,
  } = options

  return await bp.usePage(async (page) => {
    await page.setUserAgent({
      userAgent: userAgent ?? (pc ? UA_PC : UA_MOBILE),
    })

    const width = options?.width || (pc ? 1920 : 800)
    const isNight = new Date().getHours() > 18 || new Date().getHours() < 6
    const isDark = colorMode === 'dark' || (colorMode === 'auto' && isNight)
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: isDark ? 'dark' : 'light' }])

    await page.setViewport({
      width,
      height: options?.maxHeight || (pc ? 1080 : 2400),
      deviceScaleFactor,
    })

    await page.goto(url, { waitUntil, timeout })

    await wait(delayTime)

    const [scrollHeight, innerHeight] = await page.evaluate(() => [document.body.scrollHeight, window.innerHeight])

    // 如果内容很少，没有滚动，则调整高度为 body 高度
    if (scrollHeight <= innerHeight) {
      await page.setViewport({
        width,
        height: Math.min(scrollHeight, 3_600),
        deviceScaleFactor: 2,
      })
    }

    const body = await page.$(selector)

    const screenshotBuffer = Buffer.from(
      await (body || page).screenshot({
        type: 'png',
        encoding: 'binary',
        optimizeForSpeed: true,
      }),
    )

    // 使用 sharp 压缩图片,质量 95%
    const buffer = await sharp(screenshotBuffer).png({ quality: 95, compressionLevel: 9 }).toBuffer()

    const originalSize = (screenshotBuffer.length / 1024).toFixed(2)
    const compressedSize = (buffer.length / 1024).toFixed(2)
    const ratio = ((1 - buffer.length / screenshotBuffer.length) * 100).toFixed(1)
    console.log(`>>> Sharp 压缩: ${originalSize}KB -> ${compressedSize}KB (减少 ${ratio}%)`)

    return buffer
  })
}

export interface RenderReactOptions {
  width?: number
  height?: number
  useStyledFont?: boolean
  colorMode?: 'light' | 'dark' | 'auto'
  waitTimeout?: number
  bodyClassName?: string
  devicePixelRatio?: number
  elementSelector?: string
}

export type AsyncComponent<T extends object> = (props: T) => Promise<React.ReactElement>

/**
 * 将 React 元素通过流式渲染转换为字符串（支持异步组件和 use API）
 */
async function renderReactToString(element: React.ReactElement): Promise<string> {
  const stream = await renderToReadableStream(element)
  await stream.allReady
  return new Response(stream).text()
}

export function createAsyncComponent<T extends object>(AsyncComponent: AsyncComponent<T> | React.FC<T>): React.FC<T> {
  return (props: T) => {
    const result = AsyncComponent(props)
    return result instanceof Promise ? use(result) : result
  }
}

const resource = { js: '', css: '', font: '' }

async function getResourceString(fileName: string, encoding: BufferEncoding = 'utf-8') {
  return await fs.promises.readFile(path.join(__dirname, './resources', fileName), encoding)
}

export async function renderReact<T extends object>(
  bp: BrowserPool,
  Component: React.FC<T> | AsyncComponent<T>,
  props: NoInfer<T> = {} as NoInfer<T>,
  options?: RenderReactOptions,
): Promise<Buffer | null> {
  const start = performance.now()
  const mainId = 'content'

  const htmlStart = start

  const AsyncableComponent = createAsyncComponent(Component)

  const html = await renderReactToString(
    <Suspense fallback={<div style={{ display: 'none' }}>Loading...</div>}>
      <AsyncableComponent {...props} />
    </Suspense>,
  )

  console.log(`>>> React 组件渲染到 HTML 耗时 ${Math.round((performance.now() - htmlStart) * 1000) / 1000}ms`)

  const resourceStart = performance.now()

  const font = resource.font || (await getResourceString('HanYiBlack.woff2', 'base64').catch(() => ''))
  const unoJS = resource.js || (await getResourceString('uno-runtime_uno.global.min.js').catch(() => ''))
  const unoCSS = resource.css || (await getResourceString('uno-reset_tailwind.min.css').catch(() => ''))

  if (!unoJS || !unoCSS) {
    throw new Error('未找到 Uno CSS 和 JS 资源，请检查路径或文件是否存在')
  }

  resource.js = unoJS
  resource.css = unoCSS
  resource.font = font

  console.log(`>>> JS/CSS/Font 资源加载耗时 ${Math.round((performance.now() - resourceStart) * 1000) / 1000}ms`)

  const wrapper = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <style>[un-cloak] { display: none; }</style>
    <style>${
      resource.font && options?.useStyledFont === true
        ? `
    @font-face {
      font-family: 'HanYiBlack';
      font-style: normal;
      font-weight: 400;
      src: url(data:font/woff2;base64,${resource.font}) format('woff2');
    }`
        : ''
    }</style>
    <style>${unoCSS}</style>
    <script>${unoJS}</script>
  </head>
  <body class="${options?.bodyClassName || ''}" style="font-family: 'HanYiBlack', ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';">
    <main id="${mainId}" class="inline-flex">${html}</main>
  </body>
</html>
  `

  const startBrowser = performance.now()

  return await bp.usePage(async (page) => {
    console.log(`>>> 获取页面耗时 ${Math.round((performance.now() - startBrowser) * 1000) / 1000}ms`)

    const isNight = new Date().getHours() > 18 || new Date().getHours() < 6
    const isDark = options?.colorMode === 'dark' || (options?.colorMode === 'auto' && isNight)
    await page.setUserAgent(UA_MOBILE)
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: isDark ? 'dark' : 'light' }])

    const useAutoWidth = !options?.width
    const useAutoHeight = !options?.height

    const height = options?.height || 800
    const width = options?.width || Math.ceil(height / 0.618)
    const el = options?.elementSelector || `#${mainId}`

    await page.setViewport({
      width: useAutoWidth ? 3_600 : width,
      height: useAutoHeight ? 3_600 : height,
      deviceScaleFactor: options?.devicePixelRatio || 2,
    })

    const startContent = performance.now()
    await page.setContent(wrapper)
    console.log(`>>> 渲染内容耗时 ${Math.round((performance.now() - startContent) * 1000) / 1000}ms`)

    const startWait = performance.now()
    await page.waitForSelector(el, { timeout: options?.waitTimeout })
    console.log(`>>> 等待元素耗时 ${Math.round((performance.now() - startWait) * 1000) / 1000}ms`)

    // const startResize = performance.now()
    // const [scrollHeight, innerHeight] = await page.evaluate(() => [
    //   document.querySelector(el)?.scrollHeight || 12_000,
    //   window.innerHeight,
    // ])
    // // 如果内容很少，没有滚动，则调整高度为目标元素高度
    // if (useAutoHeight && scrollHeight <= innerHeight) {
    //   await page.setViewport({
    //     width: useAutoWidth ? Math.min(scrollHeight, 12_000) : width,
    //     height: useAutoHeight ? Math.min(scrollHeight, 12_000) : height,
    //     deviceScaleFactor: options?.devicePixelRatio || 2,
    //   })
    // }
    // console.log(`>>> 调整视口耗时 ${Math.round((performance.now() - startResize) * 1000) / 1000}ms`)

    const startScreenshot = performance.now()
    const wrapperHandler = await page.$(el)
    const uint8Array = await (wrapperHandler || page).screenshot({
      type: 'png',
      encoding: 'binary',
      optimizeForSpeed: true,
    })

    console.log(`>>> 截图耗时 ${Math.round((performance.now() - startScreenshot) * 1000) / 1000}ms`)

    // 使用 sharp 压缩图片, 质量 95%
    const startCompress = performance.now()
    const screenshotBuffer = Buffer.from(uint8Array)
    const compressedBuffer = await sharp(screenshotBuffer).png({ quality: 95, compressionLevel: 9 }).toBuffer()

    const originalSize = (screenshotBuffer.length / 1024).toFixed(2)
    const compressedSize = (compressedBuffer.length / 1024).toFixed(2)
    const ratio = ((1 - compressedBuffer.length / screenshotBuffer.length) * 100).toFixed(1)
    console.log(`>>> Sharp 压缩耗时 ${Math.round((performance.now() - startCompress) * 1000) / 1000}ms`)
    console.log(`>>> Sharp 压缩: ${originalSize}KB -> ${compressedSize}KB (减少 ${ratio}%)`)

    console.log('>>> 渲染流程: React 组件 -> HTML -> 连接浏览器实例 -> 渲染 -> 截图 -> Sharp 压缩')
    console.log(`>>> === 渲染任务结束，总耗时 ${Math.round((performance.now() - start) * 1000) / 1000}ms ===`)

    return compressedBuffer
  })
}
