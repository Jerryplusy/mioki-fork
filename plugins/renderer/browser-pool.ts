import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'
import * as puppeteer from 'puppeteer-core'

const _dirname = typeof __dirname !== 'undefined' ? __dirname : url.fileURLToPath(new URL('.', import.meta.url))

interface BrowserPoolOptions {
  cacheDir?: string
  enableCache?: boolean
  immediate?: boolean
  launchOptions?: puppeteer.LaunchOptions
  maxPageOpenTimes?: number
  maxWsEndpoints?: number
  onReady?: (bp: BrowserPool) => void
  waitForBrowserTimeout?: number
  preheatUrl?: string
}

interface BrowserWsEndpointItem {
  browserHashId: string
  isBusy: boolean
  wsEndpoint: string
  pageRenderTimes: number
  waitingCloseTimer: NodeJS.Timeout | null
}

export class BrowserPool {
  static _instance: BrowserPool | null = null

  #config: Required<BrowserPoolOptions> = {
    cacheDir: path.join(_dirname, '.browser-data'),
    enableCache: true,
    immediate: true,
    launchOptions: {
      headless: true,
      args: [
        '--single-process',
        '--mute-audio',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--font-render-hinting=none',
        '--disable-gpu',
        '--no-sandbox',
        '--no-first-run',
        '--no-zygote',
      ],
    },
    maxWsEndpoints: 6,
    maxPageOpenTimes: 300,
    onReady: () => {},
    waitForBrowserTimeout: 12_000,
    preheatUrl: 'https://www.baidu.com',
  }

  #browserMap: WeakMap<BrowserWsEndpointItem, puppeteer.Browser> = new WeakMap()
  #launchReady = false
  #waitingQueue: { queueId: string; timer: NodeJS.Timeout }[] = []
  #wsEndpointMap = new Map<string, BrowserWsEndpointItem>()
  #unSubscribeExitHook = () => {}

  constructor(options?: BrowserPoolOptions) {
    this.#config = {
      ...this.#config,
      ...options,
      launchOptions: {
        ...this.#config.launchOptions,
        ...options?.launchOptions,
      },
    }

    const immediate = options?.immediate ?? true

    if (immediate) {
      this.initBrowser()
    }
  }

  static async getInstance(options?: BrowserPoolOptions) {
    if (!BrowserPool._instance) BrowserPool._instance = new BrowserPool({ ...options, immediate: false })
    await BrowserPool._instance.initBrowser()
    return BrowserPool._instance
  }

  static async destroyInstance() {
    if (BrowserPool._instance) {
      await BrowserPool._instance.destroy()
      BrowserPool._instance = null
    }
  }

  async destroy(clearExitHook = true) {
    if (clearExitHook) {
      this.#unSubscribeExitHook()
    }

    for (const { timer } of this.#waitingQueue) {
      clearTimeout(timer)
    }

    this.#waitingQueue = []

    for (const instance of this.#wsEndpointMap.values()) {
      if (instance.waitingCloseTimer) {
        clearTimeout(instance.waitingCloseTimer)
      }

      const browser = this.#browserMap.get(instance)
      await browser?.close()
    }

    this.#wsEndpointMap.clear()

    this.#launchReady = false
  }

  async isBrowserBusy(browserHashId: string) {
    const instance = this.#wsEndpointMap.get(browserHashId)
    return instance ? instance.isBusy : false
  }

  async #createBrowser(browserHashId: string) {
    const browser = await puppeteer.launch({
      ...this.#config.launchOptions,
      userDataDir: this.#config.enableCache ? path.join(this.#config.cacheDir, browserHashId) : undefined,
    })

    const endpoint = browser.wsEndpoint()
    let instance = this.#wsEndpointMap.get(browserHashId)

    if (instance) {
      instance.isBusy = false
      instance.wsEndpoint = endpoint
      instance.pageRenderTimes = 1
    } else {
      instance = {
        browserHashId,
        isBusy: false,
        wsEndpoint: endpoint,
        pageRenderTimes: 1,
        waitingCloseTimer: null,
      }
      this.#wsEndpointMap.set(browserHashId, instance)
    }

    this.#browserMap.set(instance, browser)

    return browser
  }

  // async #preheatBrowser(browser: puppeteer.Browser) {
  //   const page = await browser.newPage()
  //   await page.goto(this.#config.preheatUrl)
  //   await page.close()
  // }

  async #updateBrowser(browser: puppeteer.Browser, browserHashId: string, retries = 0): Promise<puppeteer.Browser> {
    const instance = this.#wsEndpointMap.get(browserHashId)

    if (!instance) return browser

    if (instance.waitingCloseTimer) {
      clearTimeout(instance.waitingCloseTimer)
    }

    const openedPages = await browser.pages()
    const oneMinute = 60 * 1000

    if (openedPages.length > 1 && retries > 0) {
      const nextRetries = retries - 1

      instance.waitingCloseTimer = setTimeout(() => {
        this.#updateBrowser(browser, browserHashId, nextRetries)
      }, oneMinute)

      return browser
    }

    await browser.close()

    return await this.#createBrowser(browserHashId)
  }

  async initBrowser(force = false) {
    if (!force && this.#launchReady) {
      console.warn('BrowserPool has been initialized')
      return
    }

    const browserHashIds: string[] = []

    if (this.#config.enableCache && fs.existsSync(this.#config.cacheDir)) {
      const localBrowserIds = fs
        .readdirSync(this.#config.cacheDir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .slice(0, this.#config.maxWsEndpoints)

      // fill the rest of the maxWsEndpoints if not enough
      while (localBrowserIds.length < this.#config.maxWsEndpoints) {
        localBrowserIds.push(this.uuid())
      }

      for (const browserHashId of localBrowserIds) {
        const lockFile = path.join(this.#config.cacheDir, browserHashId, 'SingletonLock')

        // use try catch to make it easy, as fs.existsSync can not detect symlink
        try {
          fs.unlinkSync(lockFile)
        } catch {}

        browserHashIds.push(browserHashId)
      }
    } else {
      browserHashIds.push(...Array.from({ length: this.#config.maxWsEndpoints }, () => this.uuid()))
    }

    for (const browserHashId of browserHashIds) {
      await this.#createBrowser(browserHashId)
      await new Promise((resolve) => setTimeout(resolve, 1_000))
      // await this.#preheatBrowser(browser)
    }

    this.#launchReady = true
    this.#unSubscribeExitHook = () => this.destroy(false)

    this.#config.onReady(this)
  }

  async reloadBrowserPool(): Promise<void> {
    await this.destroy()
    await this.initBrowser(true)
  }

  getAvailableInstance() {
    return this.randItem([...this.#wsEndpointMap.values()].filter((t) => !t.isBusy))
  }

  getInstanceByBrowser(browser: puppeteer.Browser) {
    return [...this.#wsEndpointMap.values()].find((t) => t.wsEndpoint === browser.wsEndpoint())
  }

  async releaseBrowser(browser: puppeteer.Browser) {
    await browser.disconnect()
    const instance = this.getInstanceByBrowser(browser)
    if (instance) instance.isBusy = false
  }

  async getBrowser(instance = this.getAvailableInstance()): Promise<puppeteer.Browser> {
    if (!instance) {
      return new Promise<puppeteer.Browser>((resolve) => {
        const start = performance.now()
        const queueId = this.uuid()

        const timer = setInterval(() => {
          if (performance.now() - start > 30_000) {
            clearInterval(timer)
            const queueIdx = this.#waitingQueue.findIndex((q) => q.queueId === queueId)

            if (queueIdx >= 0) {
              this.#waitingQueue.splice(queueIdx, 1)
            }

            throw new Error('Timeout to get browser')
          }

          const instance = this.getAvailableInstance()
          const isCurrentTurn = this.#waitingQueue.at(0)?.queueId === queueId

          if (instance && isCurrentTurn) {
            clearInterval(timer)
            this.#waitingQueue.shift()
            resolve(this.getBrowser(instance))
          }
        }, 100)

        this.#waitingQueue.push({ queueId, timer })
      })
    }

    let browser: puppeteer.Browser

    try {
      instance.isBusy = true

      browser = await puppeteer.connect({
        browserWSEndpoint: instance.wsEndpoint,
      })

      if (instance.pageRenderTimes > this.#config.maxPageOpenTimes) {
        browser = await this.#updateBrowser(browser, instance.browserHashId)
      }
    } catch (err: any) {
      console.error(`Error in getBrowser: ${err?.message || err}`)
      browser = await this.#createBrowser(instance.browserHashId)
    }

    instance.pageRenderTimes++

    return browser
  }

  getStatus() {
    const wsEndpoints = Array.from(this.#wsEndpointMap.values())
    const availableWsEndpoints = wsEndpoints.filter((t) => !t.isBusy).length

    const { cacheDir: _, ...config } = this.#config

    return {
      version: {
        node: process.version,
        v8: process.versions.v8,
      },
      config,
      status: {
        launchReady: this.#launchReady,
        availableInstanceCount: availableWsEndpoints,
        busyInstanceCount: wsEndpoints.length - availableWsEndpoints,
        waitingQueueTaskCount: this.#waitingQueue.length,
      },
      waitingQueue: this.#waitingQueue,
      wsEndpoints,
      time: {
        uptime: `${process.uptime().toLocaleString('zh-CN')} seconds`,
        timestamp: Date.now(),
      },
    }
  }

  async useBrowser<T extends (browser: puppeteer.Browser) => Promise<any>>(callback: T): Promise<ReturnType<T> | null> {
    const browser = await this.getBrowser()
    let result = null
    try {
      result = await callback(browser)
    } catch (e: any) {
      console.error(`Error in useBrowser: ${e?.message || e}`)
      throw e
    } finally {
      await this.releaseBrowser(browser)
    }
    return result
  }

  async usePage<T extends (page: puppeteer.Page) => Promise<any>>(callback: T): Promise<ReturnType<T> | null> {
    return await this.useBrowser(async (browser) => {
      const page = await browser.newPage()
      await page.evaluate(() => document.fonts.ready)
      let result = null
      try {
        result = await callback(page)
      } catch (e: any) {
        console.error(`Error in usePage: ${e?.message || e}`)
        throw e
      } finally {
        await page.close()
      }
      return result
    })
  }

  uuid(length = 8): string {
    return Math.random().toString(16).toUpperCase().substring(2, length)
  }

  randItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
  }
}
