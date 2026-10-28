<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'
import { posts, allTags, categories } from './posts'

const props = defineProps<{ mode?: 'home' | 'archive' | 'tags' | 'categories' }>()
const mode = computed(() => props.mode || 'home')

const q = ref('')
const activeCategory = ref('')
const activeTag = ref('')
const searchEl = ref<HTMLInputElement | null>(null)

const tags = allTags()
const totalWords = posts.reduce((s, p) => s + p.words, 0)

onMounted(() => {
  const sp = new URLSearchParams(location.search)
  const c = sp.get('category')
  if (c) activeCategory.value = c
  const t = sp.get('tag')
  if (t) activeTag.value = t
})

const filtered = computed(() => {
  const key = q.value.trim().toLowerCase()
  return posts.filter((p) => {
    if (activeCategory.value && !p.categories.includes(activeCategory.value)) return false
    if (activeTag.value && !p.tags.includes(activeTag.value)) return false
    if (!key) return true
    const hay = `${p.title} ${p.description} ${p.categories.join(' ')} ${p.tags.join(' ')} ${p.date}`.toLowerCase()
    return key.split(/\s+/).every((k) => hay.includes(k))
  })
})

interface Group {
  key: string
  title: string
  desc?: string
  color?: string
  sub: string
  list: typeof posts
}

const groups = computed<Group[]>(() => {
  // 分类总览：按分类分组；一旦有筛选就退回按年份，方便看时间线
  if (mode.value === 'categories' && !activeCategory.value) {
    return categories
      .map((c) => ({
        key: c.name,
        title: c.name,
        desc: c.desc,
        color: c.color,
        sub: `${c.count} 篇`,
        list: filtered.value.filter((p) => p.categories.includes(c.name)),
      }))
      .filter((g) => g.list.length)
  }

  const map = new Map<string, typeof posts>()
  for (const p of filtered.value) {
    const y = p.date.slice(0, 4)
    if (!map.has(y)) map.set(y, [])
    map.get(y)!.push(p)
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([year, list]) => ({ key: year, title: year, sub: `${list.length} 篇`, list }))
})

const linkOf = (url: string) => withBase(`${url}.html`)
const catLink = (name: string) => `${withBase('/categories.html')}?category=${encodeURIComponent(name)}`

// 标签页 / 分类页：没选任何东西时只显示标签云或分类卡片，选中后才列文章
const hasSelection = computed(() => !!(activeCategory.value || activeTag.value || q.value.trim()))
const showList = computed(() => {
  if (mode.value === 'archive') return true
  if (mode.value === 'home') return false
  return hasSelection.value
})

const toggleCategory = (name: string) => {
  activeCategory.value = activeCategory.value === name ? '' : name
}
const toggleTag = (t: string) => {
  activeTag.value = activeTag.value === t ? '' : t
}
const reset = () => {
  q.value = ''
  activeCategory.value = ''
  activeTag.value = ''
}
function focusSearch() {
  searchEl.value?.focus()
}
</script>

<template>
  <div class="blog-shell">
    <!-- 首页 hero -->
    <header v-if="mode === 'home'" class="blog-hero">
      <div class="blog-hero-inner">
        <div class="blog-kicker">Web Security Notes</div>
        <h1 class="blog-title">
          <span class="blog-title-brand">Fan-SecLab</span>
          <span class="blog-title-sub">安全笔记</span>
        </h1>
        <p class="blog-desc">
          信息收集 · SQL 注入 · XSS · 文件上传 · 文件包含 · SSRF · 反序列化 · WAF 绕过 ——
          靶场与实战的完整记录，含踩坑细节与绕过手法。
        </p>
        <div class="blog-stats">
          <div class="stat"><b>{{ posts.length }}</b><span>篇文章</span></div>
          <div class="stat"><b>{{ categories.length }}</b><span>个分类</span></div>
          <div class="stat"><b>{{ tags.length }}</b><span>个标签</span></div>
          <div class="stat"><b>{{ (totalWords / 1000).toFixed(0) }}k</b><span>总字数</span></div>
        </div>
      </div>
    </header>

    <!-- 首页专属：分类导航（不放文章列表） -->
    <div v-if="mode === 'home'" class="home-body">
      <div v-if="categories.length" class="cat-grid">
        <a
          v-for="c in categories"
          :key="c.name"
          class="cat-card"
          :style="{ '--cat': c.color }"
          :href="`${withBase('/categories.html')}?category=${encodeURIComponent(c.name)}`"
        >
          <div class="cat-card-top">
            <span class="cat-dot" />
            <h3>{{ c.name }}</h3>
            <em>{{ c.count }} 篇</em>
          </div>
          <p>{{ c.desc || '（还没写描述）' }}</p>
        </a>
      </div>

      <p v-else class="blog-empty">
        还没有分类 —— 在文章的 front-matter 里写 <code>categories: [分类名]</code> ，再同步一次即可。
      </p>

      <p v-if="categories.length === 1 && categories[0].name === '未分类'" class="home-hint">
        现在 {{ posts.length }} 篇文章都还在「未分类」里。打开 <code>content\&lt;文章目录&gt;\&lt;文章&gt;.md</code>，
        在 front-matter 里加一行 <code>categories: [文件类漏洞, CTF 实战]</code>（可写多个），
        再选菜单 <b>2</b> 同步，这里就会长出一格格分类卡片。
      </p>

      <div class="home-actions">
        <a class="home-btn primary" :href="withBase('/archive.html')">
          浏览全部 {{ posts.length }} 篇文章 →
        </a>
        <a class="home-btn" :href="withBase('/tags.html')">按标签浏览（{{ tags.length }} 个）</a>
        <a class="home-btn" :href="withBase('/categories.html')">查看分类总览</a>
      </div>
    </div>

    <!-- 各页头部 -->
    <header v-if="mode === 'categories'" class="page-head">
      <h1>分类</h1>
      <p>共 {{ categories.length }} 个分类、{{ posts.length }} 篇文章；点分类查看文章。</p>
    </header>
    <header v-if="mode === 'tags'" class="page-head">
      <h1>标签</h1>
      <p>共 {{ tags.length }} 个标签；点标签查看文章。</p>
    </header>
    <header v-if="mode === 'archive'" class="page-head">
      <h1>全部文章</h1>
      <p>共 {{ posts.length }} 篇，按发布时间倒序排列。</p>
    </header>

    <div v-if="mode !== 'home'" class="blog-body">
      <!-- 工具条 -->
      <div class="blog-toolbar">
        <div class="blog-search">
          <svg class="blog-search-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              d="M10.5 3a7.5 7.5 0 015.9 12.1l4.3 4.3-1.4 1.4-4.3-4.3A7.5 7.5 0 1110.5 3zm0 2a5.5 5.5 0 100 11 5.5 5.5 0 000-11z"
            />
          </svg>
          <input
            ref="searchEl"
            v-model="q"
            type="search"
            placeholder="搜索标题 / 摘要 / 分类 / 标签…（按 / 聚焦）"
            aria-label="搜索文章"
            @keydown.slash.prevent="focusSearch"
          />
          <button v-if="q || activeCategory || activeTag" class="blog-clear" type="button" title="清空筛选" @click="reset">
            ✕
          </button>
        </div>
        <div class="blog-count">
          <template v-if="activeCategory">分类 <b>{{ activeCategory }}</b> · </template>
          <template v-if="activeTag">标签 <b>{{ activeTag }}</b> · </template>
          <template v-if="showList">{{ filtered.length }} / {{ posts.length }} 篇</template>
          <template v-else>共 {{ posts.length }} 篇</template>
        </div>
      </div>

      <!-- 标签页：标签云（选之前不放文章） -->
      <div v-if="mode === 'tags'" class="tag-cloud">
        <button
          v-for="t in tags"
          :key="t.name"
          type="button"
          class="tag-chip"
          :class="{ on: activeTag === t.name }"
          @click="toggleTag(t.name)"
        >
          {{ t.name }}<sup>{{ t.count }}</sup>
        </button>
      </div>

      <!-- 分类页：没选分类时，只显示分类卡片 -->
      <div v-if="mode === 'categories' && !hasSelection" class="cat-grid">
        <a
          v-for="c in categories"
          :key="c.name"
          class="cat-card"
          :style="{ '--cat': c.color }"
          :href="catLink(c.name)"
          @click.prevent="toggleCategory(c.name)"
        >
          <div class="cat-card-top">
            <span class="cat-dot" />
            <h3>{{ c.name }}</h3>
            <em>{{ c.count }} 篇</em>
          </div>
          <p>{{ c.desc || '（还没写描述）' }}</p>
        </a>
      </div>

      <!-- 未选择时的引导 -->
      <p v-if="mode === 'categories' && !hasSelection" class="about-hint">
        点任意一个分类，查看该分类下的文章；再点一次即可取消。
      </p>
      <p v-if="mode === 'tags' && !hasSelection" class="about-hint">
        选择一个标签，查看带该标签的文章；再点一次即可取消。
      </p>

      <!-- 文章列表：归档页一直显示；分类页 / 标签页选中后才显示 -->
      <template v-if="showList">
        <div v-if="mode !== 'archive'" class="list-head">
          <span class="list-head-label">
            {{ activeCategory ? '分类' : '标签' }}
            <b>{{ activeCategory || activeTag }}</b>
            <template v-if="q.trim()"> · 搜索 “{{ q.trim() }}”</template>
          </span>
          <button type="button" class="link-btn" @click="reset">
            ← 返回{{ mode === 'categories' ? '分类' : '标签' }}总览
          </button>
        </div>

        <template v-if="groups.length">
          <section v-for="g in groups" :key="g.key" class="blog-year" :class="{ 'cat-group': !!g.color }">
            <h2 class="blog-year-title" :style="g.color ? { '--cat': g.color } : undefined">
              <i v-if="g.color" class="cat-bar" />
              <span>{{ g.title }}</span>
              <em>{{ g.sub }}</em>
              <span v-if="g.desc" class="cat-desc">{{ g.desc }}</span>
            </h2>
            <ul class="post-list">
              <li v-for="p in g.list" :key="p.slug">
                <a class="post-card" :href="linkOf(p.url)">
                  <div class="post-card-body">
                    <div class="post-card-head">
                      <span
                        v-for="(cat, i) in p.categories"
                        :key="cat"
                        class="cat-badge"
                        :style="{ '--cat': p.categoryColors[i] }"
                        >{{ cat }}</span
                      >
                      <h3 class="post-card-title">{{ p.title }}</h3>
                    </div>
                    <p class="post-card-desc">{{ p.description }}</p>
                    <div class="post-card-tags">
                      <span v-for="t in p.tags.slice(0, 5)" :key="t" class="mini-tag">#{{ t }}</span>
                      <span v-if="p.tags.length > 5" class="mini-tag more">+{{ p.tags.length - 5 }}</span>
                    </div>
                  </div>
                  <div class="post-card-side">
                    <time :datetime="p.date">{{ p.date }}</time>
                    <span class="post-card-num">{{ p.words.toLocaleString() }} 字</span>
                    <span v-if="p.images" class="post-card-num">{{ p.images }} 图</span>
                  </div>
                </a>
              </li>
            </ul>
          </section>
        </template>

        <div v-else class="blog-empty">
          <template v-if="!posts.length">
            <p class="blog-empty-title">还没有文章</p>
            <p class="blog-empty-tip">
              把 Markdown 放进项目里的 <code>content\</code> 目录，再运行 <code>npm run sync</code>（或重启
              <code>npm run dev</code>）就会自动上站。
            </p>
          </template>
          <template v-else>
            没有匹配的文章 —— <button type="button" class="link-btn" @click="reset">清空筛选条件</button>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>
