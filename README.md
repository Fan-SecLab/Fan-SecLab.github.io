# Fan-SecLab 安全笔记

> Web 安全学习笔记 · 靶场实战记录 · 踩坑细节与绕过手法

**[🌐 在线阅读 → fan-seclab.github.io](https://fan-seclab.github.io/)**

| 文章 | 字数 | 配图 | 标签 |
|:---:|:---:|:---:|:---:|
| **26** 篇 | **约 7.2 万** | **629** 张 | **69** 个 |

---

## 这是什么

这是我学习 Web 安全的完整笔记库，从信息收集、SQL 注入、XSS，到文件上传/包含、SSRF、反序列化、WAF 绕过，
按「**原理 → 测试思路 → 绕过手法 → 实战案例**」的顺序整理。

和网上大量「复制粘贴型」文章不同，这里的内容都来自**自己在靶场和实验环境里一步步打出来的过程**：

- 每个漏洞都写清**触发条件**（前提不成立，手法再好也没用）
- 每种绕过都记录**为什么能绕过**（WAF 检测逻辑 vs 后端解析差异）
- 关键代码带**中文注释**，说明每一行在干什么
- 失败的尝试也保留下来 —— 那些坑往往比结论更有价值

---

## 📚 内容目录

### 基础与环境

| 文章 | 内容 |
|---|---|
| [漏洞介绍](https://fan-seclab.github.io/posts/webbug-introduction.html) | Web 漏洞分类与整体认识 |
| [Linux](https://fan-seclab.github.io/posts/linux.html) | 常用命令、目录结构、权限、用户组、进程、压缩打包 |
| [docker 容器](https://fan-seclab.github.io/posts/docker.html) | Docker 基础与常用操作 |

### 信息收集

| 文章 | 内容 |
|---|---|
| [信息收集](https://fan-seclab.github.io/posts/information-gathering.html) | 域名 / IP / 端口 / 指纹 / 敏感信息的完整收集流程与工具 |
| [信息收集综合利用工具](https://fan-seclab.github.io/posts/information-gathering-supplement.html) | JSFinder、subDomainsBrute、subfinder、OneForAll、Nmap、EHole、dirsearch 等工具实战 |
| [移动端信息收集 + 溯源信息收集](https://fan-seclab.github.io/posts/information-gathering-mobile.html) | 移动端资产与溯源思路 |

### SQL 注入

| 文章 | 内容 |
|---|---|
| [SQL 注入基本原理](https://fan-seclab.github.io/posts/sqlinsert.html) | 注入原理、注入点判断、联合查询与报错注入 |
| [SQL 注入点利用](https://fan-seclab.github.io/posts/use-of-the-sql.html) | 从注入点到数据提取的完整链路 |
| [其他数据库的注入](https://fan-seclab.github.io/posts/otherdatabases.html) | 非 MySQL 数据库的注入差异 |
| [php 弱类型 + sql 注入 ctf 解题思路](https://fan-seclab.github.io/posts/php-sql.html) | PHP 弱类型比较漏洞与注入结合，含 `php_mt_seed` 爆破种子 |

### XSS

| 文章 | 内容 |
|---|---|
| [XSS 跨站脚本攻击](https://fan-seclab.github.io/posts/xss.html) | 反射 / 存储 / DOM 型 XSS，标签闭合、编码变形、绕过过滤 |
| [xss 练习](https://fan-seclab.github.io/posts/xss-exam.html) | 靶场题目实战记录 |

### 文件类漏洞

| 文章 | 内容 |
|---|---|
| [文件上传漏洞](https://fan-seclab.github.io/posts/upload.html) | 前端校验 / MIME / 黑名单 / 双写 / 解析漏洞等上传绕过全貌 |
| [文件上传 ctf 解题思路](https://fan-seclab.github.io/posts/%E6%96%87%E4%BB%B6%E4%B8%8A%E4%BC%A0.html) | 可绕过后缀清单、`.htaccess`、`.user.ini`、图片码、shtml、盲注等进阶手法 |
| [Web 服务程序解析漏洞](https://fan-seclab.github.io/posts/web-file-parsing-vulnerability.html) | IIS / Apache / Nginx 解析漏洞 |
| [文件包含漏洞](https://fan-seclab.github.io/posts/file-inclusion.html) | LFI / RFI、php 伪协议、日志包含、临时文件包含、session 包含 |
| [ctf 文件包含](https://fan-seclab.github.io/posts/file-include.html) | 过滤绕过、路径穿越编码、自包含、条件竞争 |
| [任意文件下载](https://fan-seclab.github.io/posts/arbitrary-file-download.html) | 下载点发现、目录穿越、敏感文件清单 |

### 服务端漏洞

| 文章 | 内容 |
|---|---|
| [CSRF 攻击](https://fan-seclab.github.io/posts/csrf.html) | 原理、GET/POST 型利用、Referer 绕过、防御 |
| [XXE（XML 外部实体注入）](https://fan-seclab.github.io/posts/xxe.html) | 有回显 / 无回显（外带数据）、修复方式 |
| [RCE 命令执行漏洞](https://fan-seclab.github.io/posts/rce.html) | 命令执行与代码执行、危险函数、管道与拼接 |
| [反序列化漏洞](https://fan-seclab.github.io/posts/%E5%8F%8D%E5%BA%8F%E5%88%97%E5%8C%96.html) | 序列化机制与反序列化利用链 |
| [SSRF 漏洞详解](https://fan-seclab.github.io/posts/ssrf.html) | 协议利用、内网探测、绕过与防御 |

### 认证与绕过

| 文章 | 内容 |
|---|---|
| [暴力破解](https://fan-seclab.github.io/posts/brute-force.html) | 弱口令、爆破点判断、字典与工具 |
| [权限问题](https://fan-seclab.github.io/posts/permission-optimized.html) | 越权访问与权限校验缺失 |
| [WAF 绕过](https://fan-seclab.github.io/posts/waf%E7%BB%95%E8%BF%87.html) | WAF 检查机制、身份认证阶段绕过、数据包解析绕过、触发规则绕过、文件上传检测绕过、WAF 识别与指纹 |

---

## 🧭 站点功能

线上站点用 VitePress 构建，除了文章本身还有：

- **分类 / 标签 / 归档** —— 按主题、标签、时间三个维度检索全部文章
- **全文搜索** —— 站内搜索（快捷键 `Ctrl/⌘ + K`）
- **代码高亮 + 一键复制** —— 每个代码块带语言标注和复制按钮
- **图片放大** —— 点击截图可全屏查看，适合看命令输出的细节
- **右侧目录** —— 长文按小节跳转
- **深色模式**

---

## 🛠 技术栈

| 层 | 用的什么 |
|---|---|
| 站点框架 | [VitePress](https://vitepress.dev/) 1.6 + Vue 3 |
| 内容格式 | Markdown（一篇一个目录：md + 图片放在一起） |
| 构建 | Node.js + 自写的 `scripts/sync-posts.mjs`（规整 front-matter、修正图片路径、生成文章索引） |
| 部署 | GitHub Actions 自动构建 → GitHub Pages 托管 |
| 本地工具 | `menu.ps1` 数字交互控制台（启动 / 同步 / 构建 / 打包 / 一键部署） |

---

## 📁 目录结构（简）

```
blog/
├─ content/                  ← 文章源（每篇一个目录，md + 图片）
├─ scripts/                  ← 同步、分类、打包等脚本
├─ docs/                     ← 站点源码（配置 + 主题 + 生成的文章）
├─ docs/posts/               ← 【自动生成】文章 Markdown
├─ docs/public/assets/images/← 【自动生成】站内图片副本
└─ dist/                     ← 【自动生成】构建产物（可部署）
```

> `docs/posts/` 和 `docs/public/assets/images/` 都是 `npm run sync` 生成的，**不要手改**。

---

## 📖 相关文档

| 文档 | 内容 |
|---|---|
| [使用说明.md](使用说明.md) | 怎么启动、怎么写文章、怎么分类、菜单每个选项的作用、常见问题 |
| [部署到 GitHub Pages.md](部署到GitHub%20Pages.md) | 从零部署到公网的完整步骤（建仓库、开 Pages、绑域名、排查） |
| [开发与部署说明.md](开发与部署说明.md) | 项目内部细节：sync 脚本规则、目录约定、自定义配置 |

---

## ⚠️ 免责声明

本站所有内容**仅用于个人学习、技术研究与授权范围内的安全测试**。

请勿将文中技术用于任何未经授权的目标 —— 未授权渗透测试在多数国家和地区属于违法行为。
由使用者自身行为造成的一切后果，与本站及作者无关。
