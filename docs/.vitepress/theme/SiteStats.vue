<script setup lang="ts">
import { computed } from 'vue'
import { posts, categories, allTags } from './posts'

const tags = allTags()
const totalWords = computed(() => posts.reduce((s, p) => s + p.words, 0))
const lastDate = computed(() => posts.reduce((m, p) => (p.date > m ? p.date : m), ''))
</script>

<template>
  <div class="about-stats">
    <div class="about-stat"><b>{{ posts.length }}</b><span>篇文章</span></div>
    <div class="about-stat"><b>{{ categories.length }}</b><span>个分类</span></div>
    <div class="about-stat"><b>{{ tags.length }}</b><span>个标签</span></div>
    <div class="about-stat"><b>{{ (totalWords / 1000).toFixed(0) }}k</b><span>总字数</span></div>
    <div class="about-stat"><b class="date">{{ lastDate || '—' }}</b><span>最近更新</span></div>
  </div>
</template>
