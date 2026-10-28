<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import PostMeta from './PostMeta.vue'

const { Layout } = DefaultTheme
const { frontmatter } = useData()

/* ---------------- 正文图片：点击放大 + 缺失占位 ---------------- */
let overlay: HTMLDivElement | null = null

function closeOverlay() {
  if (!overlay) return
  overlay.classList.remove('on')
  const img = overlay.querySelector('img')
  if (img) img.setAttribute('src', '')
  document.body.style.overflow = ''
}

function openOverlay(src: string, alt: string) {
  if (!overlay) {
    overlay = document.createElement('div')
    overlay.className = 'img-lightbox'
    overlay.innerHTML =
      '<div class="img-lightbox-inner"><img alt=""><div class="img-lightbox-cap"></div><button class="img-lightbox-x" aria-label="关闭">✕</button></div>'
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || (e.target as HTMLElement).classList.contains('img-lightbox-x')) closeOverlay()
    })
    document.body.appendChild(overlay)
  }
  const img = overlay.querySelector('img') as HTMLImageElement
  const cap = overlay.querySelector('.img-lightbox-cap') as HTMLElement
  img.src = src
  img.alt = alt
  cap.textContent = alt || ''
  overlay.classList.add('on')
  document.body.style.overflow = 'hidden'
}

function onClick(e: MouseEvent) {
  const t = e.target as HTMLElement
  if (!(t instanceof HTMLImageElement)) return
  if (!t.closest('.vp-doc')) return
  if (t.classList.contains('no-zoom')) return
  e.preventDefault()
  openOverlay(t.currentSrc || t.src, t.alt)
}

function onError(e: Event) {
  const el = e.target
  if (!(el instanceof HTMLImageElement)) return
  if (!el.closest('.vp-doc')) return
  if (el.dataset.missing === '1') return
  el.dataset.missing = '1'

  const src = el.getAttribute('src') || ''
  let name = src
  try {
    name = decodeURIComponent(src.split('?')[0].split('/').pop() || src)
  } catch {
    /* keep raw */
  }

  const box = document.createElement('div')
  box.className = 'img-missing'
  const icon = document.createElement('span')
  icon.className = 'img-missing-icon'
  icon.textContent = '🖼'
  const text = document.createElement('span')
  text.className = 'img-missing-text'
  text.textContent = `图片暂缺 · ${name}`
  box.append(icon, text)
  el.replaceWith(box)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') closeOverlay()
}

onMounted(() => {
  document.addEventListener('click', onClick)
  document.addEventListener('error', onError, true)
  document.addEventListener('keydown', onKey)
})
onUnmounted(() => {
  document.removeEventListener('click', onClick)
  document.removeEventListener('error', onError, true)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <Layout>
    <template #doc-after>
      <PostMeta v-if="frontmatter.date" />
    </template>
  </Layout>
</template>
