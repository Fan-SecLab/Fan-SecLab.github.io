#!/usr/bin/env node
/**
 * sync-posts.mjs —— 把源目录里的博客 md 同步进 VitePress 站点
 *
 * 支持两种内容布局：
 *   A. 一篇一目录（推荐）：content/<日期-标题>/{文章.md, image-1.png, image-2.png ...}
 *      md 里直接写 ![说明](image-1.png)，同步时自动改成 /assets/images/<slug>/image-1.png
 *   B. 扁平布局：content/*.md + content/images/<章节号>/*.png
 *
 * 做五件事：
 *   1. 扫描源目录，收集文章（跳过模板/脚手架，-排版 版优先）
 *   2. 规整 front-matter：title / date / tags / description / category
 *   3. 按 scripts/categories.mjs 的规则给文章分类
 *   4. 复制图片到 docs/public/assets/images/，并修正 md 里的图片路径
 *   5. 生成 docs/.vitepress/theme/posts.ts 索引（首页/分类/标签页都用它）
 *
 * 用法：
 *   node scripts/sync-posts.mjs
 *   node scripts/sync-posts.mjs --src "D:\some\folder" --img "D:\some\images" --clean
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CATEGORY_META, FALLBACK, PALETTE } from './categories.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// ---------------------------------------------------------------- 参数
const argv = process.argv.slice(2)
const argOf = (name, fallback) => {
  const i = argv.indexOf(name)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback
}
const SRC_DIR = path.resolve(ROOT, argOf('--src', 'content'))
const IMG_DIR = path.resolve(ROOT, argOf('--img', 'content/images'))
const POSTS_DIR = path.join(ROOT, 'docs', 'posts')
const PUBLIC_IMG = path.join(ROOT, 'docs', 'public', 'assets', 'images')
const DATA_FILE = path.join(ROOT, 'docs', '.vitepress', 'theme', 'posts.ts')
const CLEAN = argv.includes('--clean')
const REMAP = argv.includes('--remap-images')

const SKIP_FILES = new Set(['模板.md', 'artifact.md'])
const PREFER_SUFFIX = '-排版'
const AUTHOR = 'Fan-SecLab'
const IMG_RE = /\.(png|jpe?g|gif|webp|svg|bmp)$/i

// ---------------------------------------------------------------- 工具
const log = (...a) => console.log(...a)
const pad2 = (n) => String(n).padStart(2, '0')
const isImage = (f) => IMG_RE.test(f)

function parseFrontMatter(raw) {
  const lines = raw.split(/\r?\n/)
  if (lines[0]?.trim() !== '---') return { fm: {}, body: raw }
  let end = -1
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---' || lines[i].trim() === '...') {
      end = i
      break
    }
  }
  if (end < 0) return { fm: {}, body: raw }

  const fm = {}
  let key = null
  for (const line of lines.slice(1, end)) {
    if (!line.trim() || line.trim().startsWith('#')) continue
    const listItem = line.match(/^\s*-\s+(.*)$/)
    if (listItem && key) {
      if (!Array.isArray(fm[key])) fm[key] = fm[key] ? [fm[key]] : []
      fm[key].push(listItem[1].trim().replace(/^['"]|['"]$/g, ''))
      continue
    }
    const kv = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/)
    if (kv) {
      key = kv[1]
      let v = kv[2].trim()
      if (v.startsWith('[') && v.endsWith(']')) {
        v = v
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
          .filter(Boolean)
      } else {
        v = v.replace(/^["']|["']$/g, '')
      }
      fm[key] = v
    }
  }
  return { fm, body: lines.slice(end + 1).join('\n') }
}

function normalizeDate(fmDate, ...hints) {
  const pick = (s) => {
    if (!s) return null
    const m = String(s).match(/(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})/)
    return m ? `${m[1]}-${pad2(m[2])}-${pad2(m[3])}` : null
  }
  return pick(fmDate) || hints.map(pick).find(Boolean) || null
}

function normalizeTags(fmTags) {
  if (!fmTags) return []
  const arr = Array.isArray(fmTags) ? fmTags : String(fmTags).split(/[,，、\s]+/)
  return [...new Set(arr.map((t) => String(t).trim()).filter(Boolean))]
}

function toSlug(base) {
  let s = String(base).replace(/\.md$/i, '')
  s = s.replace(/^\d{4}[-_]\d{2}[-_]\d{2}[-_]?/, '')
  s = s.replace(new RegExp(`${PREFER_SUFFIX}$`), '')
  s = s
    .replace(/[+＋\s_]+/g, '-')
    .replace(/[（）()《》【】[\]]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  return s || 'post'
}

function autoDescription(body) {
  const lines = body.split(/\r?\n/)
  const buf = []
  let inFence = false
  for (const line of lines) {
    const s = line.trim()
    if (/^(```|~~~)/.test(s)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    if (!s) {
      if (buf.length) break
      continue
    }
    if (/^#{1,6}\s/.test(s) || s.startsWith('![') || s.startsWith('<img') || s.startsWith('|') || s.startsWith('>')) {
      if (buf.length) break
      continue
    }
    if (/^[-*+]\s/.test(s) || /^\d+[.、)]\s/.test(s)) {
      if (buf.length) break
      continue
    }
    buf.push(s)
  }
  let text = buf
    .join('')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .replace(/<[^>]+>/g, '')
    .trim()
  if (text.length > 120) text = text.slice(0, 120).replace(/[，。；：、,.;:]$/, '') + '…'
  return text
}

/** shiki 不认识的语言标记 → 换成已知的 */
const LANG_ALIAS = { url: 'text', txt: 'text' }
function normalizeFences(body) {
  return body.replace(/^(\s*)(`{3,}|~{3,})([^\s`]*)\s*$/gm, (whole, indent, fence, lang) => {
    if (!lang) return whole
    const mapped = LANG_ALIAS[lang.toLowerCase()]
    return mapped && mapped !== lang ? `${indent}${fence}${mapped}` : whole
  })
}

function countWords(md) {
  const text = md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`|-]/g, ' ')
  const c = (text.match(/[\u3400-\u9fff\u3040-\u30ff]/g) || []).length
  const w = (text.replace(/[\u3400-\u9fff\u3040-\u30ff]/g, ' ').match(/[A-Za-z0-9]+/g) || []).length
  return { words: c + w, cjk: c }
}

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true })
}

function copyIfNewer(s, d) {
  const st = fs.statSync(s)
  if (fs.existsSync(d)) {
    const dt = fs.statSync(d)
    if (dt.size === st.size && dt.mtimeMs >= st.mtimeMs) return 0
  }
  fs.mkdirSync(path.dirname(d), { recursive: true })
  fs.copyFileSync(s, d)
  return st.size
}

/** 递归列出某个文章目录下所有图片（返回相对路径），跳过隐藏目录 */
function walkImages(root, rel = '') {
  const out = []
  const dir = rel ? path.join(root, rel) : root
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue
    const r = rel ? path.join(rel, e.name) : e.name
    if (e.isDirectory()) out.push(...walkImages(root, r))
    else if (isImage(e.name)) out.push(r)
  }
  return out
}

/** 从 front-matter 读分类：categories 数组 / categories 字符串 / category 单值，都认 */
function readCategories(fm) {
  const raw = fm.categories ?? fm.category
  if (raw === undefined || raw === null || raw === '') return []
  const arr = Array.isArray(raw) ? raw : String(raw).split(/[,，、;；]/)
  return [...new Set(arr.map((s) => String(s).trim()).filter(Boolean))]
}

const metaByName = new Map(CATEGORY_META.map((m) => [m.name, m]))

/** 取分类的颜色/描述：登记过的用登记的，没登记过的按名字自动配色（同名必同色） */
function metaFor(name) {
  if (name === FALLBACK.name) return FALLBACK
  const known = metaByName.get(name)
  if (known) return known
  let h = 0
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)) % 1000003
  return { name, color: PALETTE[h % PALETTE.length], desc: '' }
}

const MD_IMG_RE = /(!\[[^\]]*\]\()\s*([^)\s]+)(\s*\))/g
const HTML_IMG_RE = /(<img\b[^>]*?\bsrc\s*=\s*["'])([^"']+)(["'])/gi

/**
 * 只重写「正文里的图片引用」，代码块（``` 包围）和行内代码（`...`）里的内容原样保留。
 * XSS 那类文章正文里大量出现 `<img src="x">` 作为 payload 示例，绝不能改。
 */
function rewriteImagesOutsideCode(md, rewrite) {
  const lines = md.split('\n')
  const out = []
  let inFence = false

  for (const line of lines) {
    if (/^\s*(`{3,}|~{3,})[^\s`]*\s*$/.test(line)) {
      inFence = !inFence
      out.push(line)
      continue
    }
    if (inFence) {
      out.push(line)
      continue
    }
    // 行内代码按反引号切分，偶数段是正文，奇数段是 `代码`
    const segs = line.split(/(`[^`]*`)/g)
    out.push(
      segs
        .map((seg) =>
          seg.startsWith('`') && seg.endsWith('`') && seg.length > 1
            ? seg
            : seg
                .replace(MD_IMG_RE, (w, pre, href, post) => pre + rewrite(href) + post)
                .replace(HTML_IMG_RE, (w, pre, href, post) => pre + rewrite(href) + post)
        )
        .join('')
    )
  }
  return out.join('\n')
}

// ---------------------------------------------------------------- 主流程
if (!fs.existsSync(SRC_DIR)) {
  fs.mkdirSync(SRC_DIR, { recursive: true })
  log(`· 源目录不存在，已创建空目录：${SRC_DIR}`)
}
if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true })

if (CLEAN) {
  log('· 清理旧的 posts / 图片 …')
  rmrf(POSTS_DIR)
  rmrf(PUBLIC_IMG)
  fs.mkdirSync(POSTS_DIR, { recursive: true })
}

// 1. 收集文章源（支持「一篇一目录」和「扁平」两种布局）
function collectSources() {
  const out = []
  const entries = fs.readdirSync(SRC_DIR, { withFileTypes: true })

  for (const e of entries) {
    if (e.isFile() && /\.md$/i.test(e.name) && !SKIP_FILES.has(e.name)) {
      out.push({ mdPath: path.join(SRC_DIR, e.name), dir: SRC_DIR, mode: 'flat', base: e.name.replace(/\.md$/i, '') })
    }
  }

  for (const e of entries) {
    if (!e.isDirectory()) continue
    const dir = path.join(SRC_DIR, e.name)
    const mds = fs.readdirSync(dir).filter((f) => /\.md$/i.test(f) && !SKIP_FILES.has(f))
    if (!mds.length) continue
    if (mds.length === 1) {
      out.push({ mdPath: path.join(dir, mds[0]), dir, mode: 'folder', base: e.name })
    } else {
      for (const m of mds) {
        out.push({ mdPath: path.join(dir, m), dir, mode: 'folder', base: m.replace(/\.md$/i, '') })
      }
    }
  }
  return out
}

const allSources = collectSources()

// -排版 版优先：同一 base 存在 xxx 与 xxx-排版 时丢掉未排版的
const layoutBases = new Set(allSources.map((s) => s.base).filter((b) => b.endsWith(PREFER_SUFFIX)))
const sources = allSources.filter((s) => s.base.endsWith(PREFER_SUFFIX) || !layoutBases.has(s.base + PREFER_SUFFIX))
const dupCount = allSources.length - sources.length

// 2. 图片索引（扁平布局用，也用于缺失统计）
const imgRel = new Set()
const imgByBase = new Map()
if (fs.existsSync(IMG_DIR)) {
  for (const d of fs.readdirSync(IMG_DIR, { withFileTypes: true })) {
    if (!d.isDirectory()) continue
    for (const f of fs.readdirSync(path.join(IMG_DIR, d.name))) {
      if (!isImage(f)) continue
      const rel = `${d.name}/${f}`
      imgRel.add(rel)
      if (!imgByBase.has(f)) imgByBase.set(f, [])
      imgByBase.get(f).push(rel)
    }
  }
}
function resolveImage(rel) {
  if (!REMAP || imgRel.has(rel)) return rel
  const alt = imgByBase.get(path.posix.basename(rel))
  return alt && alt.length === 1 ? alt[0] : rel
}

log(`· 源目录：${SRC_DIR}`)
log(
  `· 待处理 ${sources.length} 篇（其中「一篇一目录」${sources.filter((s) => s.mode === 'folder').length} 篇${
    dupCount ? `，跳过重复排版副本 ${dupCount} 篇` : ''
  }）`
)
log('')

// 3. 逐篇转换
const posts = []
const missingImages = new Set()
const perPostMissing = {}
const remapped = []
let copiedFiles = 0
let copiedBytes = 0

for (const src of sources) {
  const raw = fs.readFileSync(src.mdPath, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')
  const { fm, body } = parseFrontMatter(raw)

  const slug = toSlug(src.base)
  const h1 = body.match(/^#\s+(.+)$/m)
  const title = String(fm.title || (h1 ? h1[1].trim() : '')).trim() || src.base
  const date =
    normalizeDate(fm.date, src.base, path.basename(src.mdPath)) ||
    fs.statSync(src.mdPath).mtime.toISOString().slice(0, 10)
  const tags = normalizeTags(fm.tags || fm.tag)
  const description = String(fm.description || '').trim() || autoDescription(body)
  const author = String(fm.author || AUTHOR).trim()
  const catNames = readCategories(fm)
  const cats = catNames.length ? catNames : [FALLBACK.name]
  const catMetas = cats.map(metaFor)

  // 目录模式：文章目录下的图片（含子目录）复制到 <slug>/ 下，统一拍平到一层
  if (src.mode === 'folder') {
    for (const rel of walkImages(src.dir)) {
      const name = path.basename(rel)
      copiedBytes += copyIfNewer(path.join(src.dir, rel), path.join(PUBLIC_IMG, slug, name))
      copiedFiles++
    }
  }

  // 修正正文里的图片路径（markdown ![]() 和 HTML <img src> 两种写法都要处理）
  const used = []
  const moved = []

  const rewrite = (href) => {
    const h = String(href).trim()
    if (/^([a-z]+:|\/\/|\/)/i.test(h)) {
      if (h.startsWith('/assets/images/')) used.push(h.slice('/assets/images/'.length))
      return h
    }
    let rel
    if (src.mode === 'folder') {
      rel = `${slug}/${h.replace(/^\.\//, '').split('/').pop()}`
    } else {
      const m = h.match(/^(?:\.\.\/)*(?:图片\/)?((?:\d{2})\/)?(.+)$/)
      rel = m ? `${m[1] || ''}${m[2]}` : h
      const fixed = resolveImage(rel)
      if (fixed !== rel) {
        moved.push([rel, fixed])
        rel = fixed
      }
    }
    used.push(rel)
    return `/assets/images/${rel}`
  }

  const bodyFixed = rewriteImagesOutsideCode(normalizeFences(body), rewrite)
  if (moved.length) remapped.push({ post: src.base, moves: moved })

  const miss = used.filter((r) =>
    src.mode === 'folder' ? !fs.existsSync(path.join(PUBLIC_IMG, r)) : !imgRel.has(r)
  )
  if (miss.length) perPostMissing[slug] = miss
  miss.forEach((m) => missingImages.add(m))

  const out = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `date: ${JSON.stringify(date)}`,
    `categories: ${JSON.stringify(cats)}`,
    `tags: ${JSON.stringify(tags)}`,
    `description: ${JSON.stringify(description)}`,
    `author: ${JSON.stringify(author)}`,
    'aside: right',
    'outline: [2, 3]',
    '---',
    '',
    bodyFixed.replace(/^\n+/, ''),
  ].join('\n')

  fs.writeFileSync(path.join(POSTS_DIR, `${slug}.md`), out, 'utf8')

  const { words, cjk } = countWords(body)
  posts.push({
    url: `/posts/${slug}`,
    slug,
    title,
    date,
    categories: cats,
    categoryColors: catMetas.map((m) => m.color),
    tags,
    description,
    author,
    words,
    cjk,
    source: src.mode === 'folder' ? path.basename(src.dir) : path.basename(src.mdPath),
    images: used.length,
  })
}

posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.title.localeCompare(b.title, 'zh')))

// 4. 扁平布局：把 IMG_DIR 整棵拷过去
if (fs.existsSync(IMG_DIR)) {
  for (const d of fs.readdirSync(IMG_DIR, { withFileTypes: true })) {
    if (!d.isDirectory()) continue
    for (const f of fs.readdirSync(path.join(IMG_DIR, d.name))) {
      if (!isImage(f)) continue
      copiedBytes += copyIfNewer(path.join(IMG_DIR, d.name, f), path.join(PUBLIC_IMG, d.name, f))
      copiedFiles++
    }
  }
}

// 5. 清理源目录里已删掉的文章
const keepFiles = new Set(posts.map((p) => `${p.slug}.md`))
let pruned = 0
for (const f of fs.readdirSync(POSTS_DIR)) {
  if (f.toLowerCase().endsWith('.md') && !keepFiles.has(f)) {
    fs.rmSync(path.join(POSTS_DIR, f), { force: true })
    pruned++
  }
}

// 6. 分类汇总：只统计实际用到的；已知分类按 CATEGORY_META 的顺序，其余按篇数排后面
const usedCount = new Map()
for (const p of posts) {
  for (const c of p.categories) usedCount.set(c, (usedCount.get(c) || 0) + 1)
}

const metaOrder = new Map(CATEGORY_META.map((m, i) => [m.name, i]))
const categories = [...usedCount.entries()]
  .map(([name, count]) => {
    const meta = metaFor(name)
    return {
      name,
      color: meta.color,
      desc: meta.desc || '',
      count,
      order: metaOrder.has(name) ? metaOrder.get(name) : 1000,
    }
  })
  .sort((a, b) => a.order - b.order || b.count - a.count || a.name.localeCompare(b.name, 'zh'))
  .map(({ order, ...rest }) => rest)

// 7. 生成 posts.ts
const banner = '// 本文件由 scripts/sync-posts.mjs 自动生成，请勿手改\n'
const data = `${banner}export interface Post {
  url: string
  slug: string
  title: string
  date: string
  categories: string[]
  categoryColors: string[]
  tags: string[]
  description: string
  author: string
  words: number
  cjk: number
  source: string
  images: number
}

export interface Category {
  name: string
  color: string
  desc: string
  count: number
}

export const posts: Post[] = ${JSON.stringify(posts, null, 2)}

export const categories: Category[] = ${JSON.stringify(categories, null, 2)}

export const allTags = (): { name: string; count: number }[] => {
  const map = new Map<string, number>()
  for (const p of posts) for (const t of p.tags) map.set(t, (map.get(t) || 0) + 1)
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh'))
}

export const byYear = (): { year: string; posts: Post[] }[] => {
  const map = new Map<string, Post[]>()
  for (const p of posts) {
    const y = p.date.slice(0, 4)
    if (!map.has(y)) map.set(y, [])
    map.get(y)!.push(p)
  }
  return [...map.entries()].map(([year, posts]) => ({ year, posts })).sort((a, b) => b.year.localeCompare(a.year))
}
`
fs.writeFileSync(DATA_FILE, data, 'utf8')

// 8. 缺失清单
const totalRefs = posts.reduce((s, p) => s + p.images, 0)
const report = {
  generatedAt: new Date().toISOString(),
  srcDir: SRC_DIR,
  imgDir: IMG_DIR,
  remapEnabled: REMAP,
  totalRefs,
  resolved: totalRefs - missingImages.size,
  missingCount: missingImages.size,
  remappedCount: remapped.reduce((s, r) => s + r.moves.length, 0),
  remapped,
  missing: [...missingImages].sort(),
  byPost: perPostMissing,
}
fs.writeFileSync(path.join(ROOT, 'scripts', 'missing-images.json'), JSON.stringify(report, null, 2), 'utf8')

// 9. 汇报
const totalWords = posts.reduce((s, p) => s + p.words, 0)
log(`✓ 已生成 ${posts.length} 篇文章 → docs/posts/`)
if (pruned) log(`✓ 已清理 ${pruned} 篇源目录里已不存在的旧文章`)
log(`✓ 图片 ${copiedFiles} 张（${(copiedBytes / 1024 / 1024).toFixed(1)} MB）→ docs/public/assets/images/`)
log(`✓ 图片引用 ${totalRefs} 处：命中 ${report.resolved}，缺失 ${report.missingCount}`)
log(`✓ 已生成索引 → docs/.vitepress/theme/posts.ts（约 ${totalWords.toLocaleString()} 字）`)
log('')

if (!posts.length) {
  log(`  （空）内容目录 ${SRC_DIR} 里还没有 md 文章`)
  log('  → 把 md 放进去，再运行 npm run sync（或 npm run dev）即可上站')
} else {
  for (const c of categories) {
    log(`【${c.name}】${c.count} 篇`)
    for (const p of posts.filter((x) => x.categories.includes(c.name))) {
      log(`  ${p.date}  ${p.title}${p.images ? `  [${p.images} 图]` : ''}`)
    }
  }
}

if (missingImages.size) {
  log('')
  log(`⚠ ${missingImages.size} 张被引用的图片找不到：`)
  for (const m of [...missingImages].slice(0, 15)) log(`    - ${m}`)
  if (missingImages.size > 15) log(`    … 其余 ${missingImages.size - 15} 张略`)
}
