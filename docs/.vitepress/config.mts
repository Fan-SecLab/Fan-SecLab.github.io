import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vitepress'
import { posts, categories, allTags } from './theme/posts'

const SITE = {
  title: 'Fan-SecLab',
  desc: 'Web 安全学习笔记 · 信息收集 / SQL 注入 / XSS / 文件上传 / 反序列化',
}

/**
 * 有些文章的截图目前还只存在于 docx 里，public 下没有对应文件。
 * Vite 默认会把这些 /assets/images/... 当模块去解析，找不到就直接构建失败。
 * 这里把「不存在的 public 资源」拦下来，返回原 URL 字符串：
 * 构建照常完成，运行时 404 → 由主题里的 JS 渲染成「图片暂缺」占位框。
 */
let publicDir = ''
const missingPublicAsset = {
  name: 'vp-missing-public-asset',
  enforce: 'pre' as const,
  configResolved(cfg: any) {
    publicDir = cfg.publicDir
  },
  resolveId(id: string) {
    if (!publicDir || !id.startsWith('/assets/')) return
    if (fs.existsSync(path.join(publicDir, id))) return
    return '\0missing-asset:' + id
  },
  load(id: string) {
    if (id.startsWith('\0missing-asset:')) {
      return `export default ${JSON.stringify(id.slice('\0missing-asset:'.length))}`
    }
  },
}

export default defineConfig({
  lang: 'zh-CN',
  title: SITE.title,
  description: SITE.desc,
  // 部署到 GitHub Pages 时由 CI 通过环境变量注入：
  //   <用户名>.github.io 仓库 → '/'（默认值，本地开发也是它）
  //   普通仓库             → '/<仓库名>/'
  base: process.env.VITEPRESS_BASE || '/',
  lastUpdated: true,
  // 生成 /posts/xxx.html 这种最通用的静态地址，任何静态服务器都能直接跑
  cleanUrls: false,
  ignoreDeadLinks: true,
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#2c5f94' }],
  ],

  vite: {
    plugins: [missingPublicAsset],
    server: {
      watch: {
        // 构建产物 / 缓存 / 编辑器临时文件不要进监听队列：
        // Windows 上 watch 中文文件名会抛 UNKNOWN，watch 到编辑器的 .tmp 会抛 EBUSY
        ignored: ['**/.vitepress/dist/**', '**/.vitepress/cache/**', '**/.*.tmpdir/**', '**/*.tmp'],
      },
    },
  },

  // 产物放到项目根 dist/，不进 docs（避免被 dev server 监听）
  outDir: '../dist',

  markdown: {
    lineNumbers: true,
    theme: { light: 'github-light', dark: 'github-dark' },
    image: { lazyLoading: true },
    container: { tipLabel: '提示', warningLabel: '注意', dangerLabel: '危险', infoLabel: '说明', detailsLabel: '展开' },
    config(md) {
      // 行内代码里出现 {{ ... }}（比如 XSS 里的 `{{Untrusted Data}}`）时，
      // VitePress 只会给围栏代码加 v-pre，行内代码不会，Vue 会把它当插值解析导致构建失败。
      // 这里统一给行内代码补上 v-pre。
      const rule = md.renderer.rules.code_inline
      md.renderer.rules.code_inline = (tokens, idx, options, env, self) => {
        const out = rule
          ? rule(tokens, idx, options, env, self)
          : `<code>${md.utils.escapeHtml(tokens[idx].content)}</code>`
        return out.replace(/^<code(?![^>]*\sv-pre)/, '<code v-pre')
      }
    },
  },

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: SITE.title,
    nav: [
      { text: '首页', link: '/' },
      { text: '分类', link: '/categories' },
      { text: '全部文章', link: '/archive' },
      { text: '标签', link: '/tags' },
      { text: '关于', link: '/about' },
    ],
    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    lastUpdated: { text: '最后更新', formatOptions: { dateStyle: 'short', timeStyle: 'short' } },
    returnToTopLabel: '回到顶部',
    darkModeSwitchLabel: '外观',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    externalLinkIcon: true,
    footer: {
      message: `共 ${posts.length} 篇笔记 · ${categories.length} 个分类 · ${allTags().length} 个标签 · 仅供个人学习与授权测试使用`,
      copyright: 'Fan-SecLab · 本博客内容仅用于学习与研究',
    },
    search: {
      provider: 'local',
      options: {
        detailedView: true,
        translations: {
          button: { buttonText: '搜索文章', buttonAriaLabel: '搜索文章' },
          modal: {
            noResultsText: '没有找到结果',
            resetButtonTitle: '清空',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭',
            },
          },
        },
        miniSearch: {
          searchOptions: {
            prefix: true,
            fuzzy: 0.2,
            boost: { title: 4, text: 1 },
          },
        },
      },
    },
  },
})
