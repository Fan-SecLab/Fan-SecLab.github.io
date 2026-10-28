# 部署到 GitHub Pages（公网访问）

> 📖 **文档导航**
> [README.md](README.md)（博客内容介绍）· [使用说明.md](使用说明.md)（日常操作）· [开发与部署说明.md](开发与部署说明.md)（项目内部细节）· **部署到GitHub Pages.md**（本文件）

本站是纯静态站，`npm run build` 生成的 `dist\` 就是完整站点，可以直接放到任何静态托管。
下面用 **GitHub Actions 自动构建 + 自动发布**，以后 push 一次就自动上线。

---

## 一、先选仓库类型（决定网址）

| 方式 | 仓库名 | 访问网址 | base |
|---|---|---|---|
| **A. 用户站（推荐）** | `<你的用户名>.github.io` | `https://<用户名>.github.io/` | `/` |
| B. 项目站 | 任意名字，如 `blog` | `https://<用户名>.github.io/blog/` | `/blog/` |

两种都已支持 —— workflow 会自动判断仓库名并设置 base，你不需要手改配置。

> 但如果你已经有 `Fan-SecLab.github.io` 这个仓库（之前跑 Jekyll 那个），
> 直接覆盖它的内容会让旧博客下线。想保留旧站就选 **B**，用一个新仓库名。

---

## 二、创建仓库

1. 打开 https://github.com/new
2. 仓库名按上表填（方式 A 必须叫 `<用户名>.github.io`）
3. 选 **Public**（Private 仓库也能用 Pages，但需要 Pro 账号；免费账号必须公开）
4. **不要**勾选 "Add a README file"（避免和本地冲突）
5. 点 Create repository

---

## 三、本地初始化并推送

在 `D:\blog` 目录执行（把地址换成你刚创建的仓库）：

```powershell
cd D:\blog

git init
git branch -M main

git add .
git commit -m "init: Fan-SecLab 博客（VitePress）"

git remote add origin https://github.com/<用户名>/<仓库名>.git
git push -u origin main
```

首次 push 会让你登录。推荐用 **Personal Access Token** 当密码：
GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
→ Generate new token，勾选 `repo` 权限，把生成的 token 当密码粘贴。

> 如果之前配过 SSH key，也可以把地址换成 `git@github.com:<用户名>/<仓库名>.git`。

---

## 四、开启 Pages

1. 进仓库 → **Settings** → 左侧 **Pages**
2. **Source** 选 **GitHub Actions**（不要选 Deploy from a branch）
3. 保存

---

## 五、触发部署

仓库只要有 push 就会自动跑 workflow（`.github/workflows/deploy.yml`）。

手动触发：仓库 → **Actions** → 左侧「部署到 GitHub Pages」→ 右侧 **Run workflow**。

跑完在 Actions 里能看到：

```
build   ✓  构建（同步内容 + 生成静态站）
deploy  ✓  发布到 GitHub Pages
```

首次部署大约 1~3 分钟。完成后网址在 **Settings → Pages** 顶部显示。

---

## 六、以后更新文章

```powershell
cd D:\blog
# 1) 把新文章放进 content\<日期>-<名字>\（md + 图片放同一目录）
# 2) 提交推送
git add .
git commit -m "新增：xxx"
git push
```

push 完 GitHub 自动同步内容 → 构建 → 发布，不用本机跑构建。

也可以本地先看效果：

```powershell
cd D:\blog
npm run build
npm run preview      # http://localhost:4173
```

---

## 七、本站已经做过的部署适配

| 项目 | 说明 |
|---|---|
| `base` 自动适配 | `docs\.vitepress\config.mts` 读取环境变量 `VITEPRESS_BASE`，workflow 按仓库名自动注入 |
| 图片路径 | 已验证：VitePress 会给 `/assets/images/...` 自动加上 base 前缀，两种仓库都能正常显示 |
| 站内图片不提交 | `.gitignore` 已忽略 `docs\public\assets\images\`（56 MB），CI 上由 `npm run sync` 从 `content\` 重新生成 —— 已实测：干净检出也能 100% 还原 624 张图 |
| 路径大小写 | 已全量检查 560 处图片引用，**全部精确匹配**，Linux 构建不会 404 |
| 体积 | `content\` 约 57 MB（图片），远低于 GitHub 单仓库 1 GB 建议上限 |

---

## 八、常见问题

### 页面能打开但样式/图片全丢
说明 `base` 不对。检查 Actions 日志里「计算 base 路径」这一步输出的值：
- 仓库名是 `xxx.github.io` → 应该是 `/`
- 其它 → 应该是 `/仓库名/`

### Actions 报 `npm ci` 失败
`package-lock.json` 与 `package.json` 不一致。本地执行 `npm install` 后提交新的 lock 文件。

### 部署成功但打开是 404
Settings → Pages 里确认 Source 是 **GitHub Actions**；
再确认 workflow 的 `deploy` job 是绿色勾。

### 想绑自己的域名
仓库 Settings → Pages → Custom domain 填域名，然后在域名商处加：
- CNAME 记录指向 `<用户名>.github.io`（用子域名时）
- 或 A 记录指向 GitHub 的四个 IP（用根域名时）

配好后建议勾上 Enforce HTTPS。

### 想手动上传 dist（不用 Actions）
不推荐（每次都要重新上传 60 MB）。真要用：本地 `npm run build`，
把 `dist\` 里的内容推到 `gh-pages` 分支，Pages 的 Source 改成该分支。
注意这样需要把 `base` 手动写死成正确的值。
