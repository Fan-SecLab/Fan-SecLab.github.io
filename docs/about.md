---
title: 关于本站
---

# 关于本站

这是一个 **本地部署的安全笔记博客**，用 [VitePress](https://vitepress.dev/) 构建。
所有内容是我在学习 Web 安全过程中的靶场记录与实战复盘，偏向「原理 → 手法 → 绕过 → 复盘」的完整链路。

<SiteStats />

## 内容分布

下面的分类和篇数**跟着文章实时统计**（改了文章分类、加了文章，这里会一起变）。

<CategoryList />

## 技术栈

- **VitePress 1.6** + Vue 3，纯静态输出，无后端依赖
- Markdown 写作，前端即时搜索（支持中文）
- 站内图片随仓库走 `docs/public/assets/images/`，不依赖图床
- 支持深色 / 浅色主题、代码高亮、点击放大截图
- 首页为分类导航，文章列表在「全部文章」页

## 本地运行

```bash
npm install        # 安装依赖（只需一次）
npm run dev        # 开发模式 → http://localhost:5173
npm run sync       # 只同步内容（加完文章/图片后）
npm run build      # 构建静态站 → dist/
npm run pack       # 构建并打包 zip → release/
npm run preview    # 本地预览 dist/（http://localhost:4173）
```

> 双击桌面「启动博客」会打开一个数字菜单，上面这些操作都能用数字选，跑完还会显示结果。

## 新增一篇文章

1. 在 `content\` 下建一个目录，例如 `content\2026-10-20-XXE进阶\`
2. 把 `.md` 和它的图片放进同一个目录（图片写 `![说明](图片名.png)` 即可）
3. 在 front-matter 里写分类：`categories: [文件类漏洞, CTF 实战]`（可写多个，不写就是「未分类」）
4. 运行 `npm run sync`（或用菜单选 `2`），刷新页面即可看到

> [!TIP]
> 分类的颜色、描述、排序在 `scripts\categories.mjs` 里调；没登记过的分类会按名字自动配色。

## 免责声明

本站所有内容仅用于**个人学习、技术研究与授权测试**。
请勿将文中技术用于任何未获授权的目标；因使用不当造成的后果由使用者自行承担。
