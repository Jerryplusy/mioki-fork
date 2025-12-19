import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'mioki',
  lang: 'zh-CN',
  description: '💓 基于 NapCat 的插件式 OneBot 机器人框架，KiviBot 的精神继承者。',
  head: [
    ['link', { rel: 'preconnect', href: 'https://unpkg.com' }],
    ['link', { rel: 'dns-prefetch', href: 'https://unpkg.com' }],
    ['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }],
  ],
  markdown: {
    theme: 'one-dark-pro',
  },
  lastUpdated: true,
  themeConfig: {
    logo: '/logo.png',
    search: {
      provider: 'local',
    },
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/vikiboss/mioki',
      },
      // {
      //   icon: 'qq',
      //   link: 'xxx',
      // },
    ],
    nav: [
      { text: 'mioki', link: '/intro' },
      { text: 'NapCat SDK', link: '/napcat-sdk' },
      { text: '支持', link: '/reward' },
    ],
    sidebar: [
      {
        text: '指南',
        items: [
          { text: '简介', link: '/intro' },
          { text: '快速开始', link: '/start' },
          { text: '插件入门', link: '/plugin' },
        ],
      },
      {
        text: 'mioki',
        items: [
          { text: '插件进阶', link: '/mioki/plugin' },
          { text: 'mioki API', link: '/mioki/api' },
        ],
      },
      {
        text: 'NapCat SDK',
        items: [
          { text: '概览', link: '/napcat-sdk' },
          { text: 'API 参考', link: '/napcat-sdk/api' },
          { text: '事件', link: '/napcat-sdk/event' },
        ],
      },
    ],
    outline: 2,
    outlineTitle: '大纲',
    lastUpdatedText: '上次更新',
    docFooter: {
      prev: '上一页',
      next: '下一页',
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025-present Viki',
    },
  },
})
