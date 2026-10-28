<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import { posts, categories } from './posts'

const { frontmatter, page } = useData()

const cur = computed(() => {
  const slug = page.value.relativePath.split('/').pop()?.replace(/\.md$/, '') || ''
  return posts.find((p) => p.slug === slug)
})

const tags = computed<string[]>(() => {
  const t = frontmatter.value.tags
  if (Array.isArray(t)) return t as string[]
  return typeof t === 'string' ? [t] : []
})

const cats = computed<string[]>(() => {
  if (cur.value?.categories?.length) return cur.value.categories
  const c = frontmatter.value.categories ?? frontmatter.value.category
  if (Array.isArray(c)) return c as string[]
  return typeof c === 'string' && c.trim() ? [c.trim()] : []
})

const colorOf = (name: string) => categories.find((x) => x.name === name)?.color || '#94a3b8'

const tagLink = (t: string) => `${withBase('/tags.html')}?tag=${encodeURIComponent(t)}`
const catLink = (c: string) => `${withBase('/categories.html')}?category=${encodeURIComponent(c)}`
</script>

<template>
  <footer class="post-footer">
    <div v-if="cats.length" class="post-footer-cat">
      <span class="post-footer-label">分类</span>
      <a
        v-for="c in cats"
        :key="c"
        class="cat-badge"
        :style="{ '--cat': colorOf(c) }"
        :href="catLink(c)"
        >{{ c }}</a
      >
    </div>
    <div class="post-footer-tags">
      <span class="post-footer-label">标签</span>
      <a v-for="t in tags" :key="t" class="post-tag" :href="tagLink(t)"># {{ t }}</a>
      <span v-if="!tags.length" class="post-footer-muted">无</span>
    </div>
    <div class="post-footer-meta">
      <span v-if="frontmatter.date">📅 {{ frontmatter.date }}</span>
      <span v-if="cur">📝 {{ cur.words.toLocaleString() }} 字</span>
      <span v-if="cur?.images">🖼 {{ cur.images }} 张图</span>
      <span v-if="cur?.source" class="post-footer-muted">源文件：content\{{ cur.source }}\</span>
    </div>
    <p class="post-footer-note">
      本文为个人学习笔记，仅在授权范围内用于安全研究；请勿用于未获授权的测试。
    </p>
  </footer>
</template>
