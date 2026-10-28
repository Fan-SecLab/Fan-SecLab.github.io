#!/usr/bin/env node
/**
 * pack.mjs —— 把 dist\ 打包成一个 zip，方便上传到虚拟主机 / 发给别人
 *
 * 产物：release\fanseclab-blog-<日期>-<时分>.zip
 * 里面是 dist 的「内容」（不含 dist 这一层），解压后直接就是网站根目录
 *
 * 单独用：  node scripts/pack.mjs
 * 一起用：  npm run pack      （= sync + build + 打包）
 */

import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DIST = path.join(ROOT, 'dist')
const OUT_DIR = path.join(ROOT, 'release')

if (!fs.existsSync(DIST) || !fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('✗ 没找到 dist/，请先运行 npm run build')
  process.exit(1)
}

const now = new Date()
const pad = (n) => String(n).padStart(2, '0')
const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`
const outFile = path.join(OUT_DIR, `fanseclab-blog-${stamp}.zip`)

fs.mkdirSync(OUT_DIR, { recursive: true })
if (fs.existsSync(outFile)) fs.rmSync(outFile, { force: true })

const files = fs.readdirSync(DIST)
console.log(`· 正在压缩 dist/（${files.length} 个顶层条目）…`)
const t0 = Date.now()

// 用 PowerShell 的 Compress-Archive：Windows 自带，无需额外依赖
// （stdio inherit：不通过管道捕获输出，避免沙箱/编码问题）
const cmd = `Compress-Archive -Path '${path.join(DIST, '*').replace(/'/g, "''")}' -DestinationPath '${outFile.replace(/'/g, "''")}' -CompressionLevel Optimal -Force`
execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', cmd], { stdio: 'inherit' })

const sizeMB = (fs.statSync(outFile).size / 1024 / 1024).toFixed(1)
const secs = ((Date.now() - t0) / 1000).toFixed(1)

console.log('')
console.log(`✓ 打包完成：${outFile}`)
console.log(`  大小 ${sizeMB} MB · 耗时 ${secs} 秒`)
console.log('  解压后直接就是网站根目录（index.html 在最外层）')
