#!/usr/bin/env node
/**
 * serve-dist.mjs —— 本地预览 dist\ 的极简静态服务器
 *
 * 为什么不直接用 `vitepress preview`：
 *   它启动时会把文件清单缓存住，之后重新 build 出来的新文件（文件名带 hash）
 *   会 404 —— 表现为「页面样式全丢」，必须关掉重开才行。
 *   这个服务器每次请求都读盘，重建后刷新浏览器即可，无需重启。
 *
 * 用法：  npm run preview          （默认 4173）
 *        node scripts/serve-dist.mjs 8080
 */

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')
const PORT = Number(process.argv[2] || 4173)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.zip': 'application/zip',
}

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('✗ 没有 dist\\ —— 先运行 npm run build')
  process.exit(1)
}

const send = (res, code, type, body) => {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' })
  res.end(body)
}

const server = http.createServer((req, res) => {
  let urlPath
  try {
    urlPath = decodeURIComponent((req.url || '/').split('?')[0])
  } catch {
    return send(res, 400, 'text/plain; charset=utf-8', '400 Bad Request')
  }

  if (urlPath === '/' || urlPath === '') urlPath = '/index.html'

  // 防目录穿越
  const target = path.join(DIST, path.normalize(urlPath).replace(/^([\\/]|\.\.)+/, ''))
  if (!target.startsWith(DIST)) return send(res, 403, 'text/plain; charset=utf-8', '403 Forbidden')

  let file = target
  try {
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html')
    // /posts/xxx → /posts/xxx.html
    if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html'

    const buf = fs.readFileSync(file)
    const ext = path.extname(file).toLowerCase()
    send(res, 200, MIME[ext] || 'application/octet-stream', buf)
  } catch {
    const nf = path.join(DIST, '404.html')
    if (fs.existsSync(nf)) send(res, 404, 'text/html; charset=utf-8', fs.readFileSync(nf))
    else send(res, 404, 'text/plain; charset=utf-8', '404 Not Found')
  }
})

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`✗ 端口 ${PORT} 已被占用 —— 换个端口：node scripts/serve-dist.mjs 4180`)
  } else {
    console.error('✗', e.message)
  }
  process.exit(1)
})

server.listen(PORT, () => {
  console.log('')
  console.log(`  预览 dist\\  →  http://localhost:${PORT}/`)
  console.log('  每次请求都读盘：重新构建后刷新浏览器即可，不用重启')
  console.log('  按 Ctrl+C 停止')
  console.log('')
})
