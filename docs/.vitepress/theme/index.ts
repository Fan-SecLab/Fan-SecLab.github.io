import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import BlogHome from './BlogHome.vue'
import PostMeta from './PostMeta.vue'
import SiteStats from './SiteStats.vue'
import CategoryList from './CategoryList.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('BlogHome', BlogHome)
    app.component('PostMeta', PostMeta)
    app.component('SiteStats', SiteStats)
    app.component('CategoryList', CategoryList)
  },
} satisfies Theme
