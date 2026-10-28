<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { posts, categories } from './posts'

const maxCount = computed(() => Math.max(1, ...categories.map((c) => c.count)))
const onlyFallback = computed(() => categories.length === 1 && categories[0].name === '未分类')
const sumCount = computed(() => categories.reduce((s, c) => s + c.count, 0))
</script>

<template>
  <div class="about-cats">
    <a
      v-for="c in categories"
      :key="c.name"
      class="about-cat"
      :style="{ '--cat': c.color }"
      :href="`${withBase('/categories.html')}?category=${encodeURIComponent(c.name)}`"
    >
      <span class="about-cat-head">
        <span class="about-cat-name"><i class="cat-dot" />{{ c.name }}</span>
        <span class="about-cat-count">{{ c.count }} 篇</span>
      </span>
      <span class="about-cat-bar"><i :style="{ width: `${(c.count / maxCount) * 100}%` }" /></span>
      <span v-if="c.desc" class="about-cat-desc">{{ c.desc }}</span>
    </a>
  </div>

  <p v-if="onlyFallback" class="about-hint">
    目前全部 {{ posts.length }} 篇文章都还在「未分类」里。
    在文章 front-matter 里写 <code>categories: [分类名]</code>（可写多个）后同步，这张表会自动按真实分类统计。
  </p>
  <p v-else-if="sumCount > posts.length" class="about-hint">
    一篇可以属于多个分类，所以各分类篇数之和（{{ sumCount }}）会大于文章总数（{{ posts.length }}）。
  </p>
</template>
