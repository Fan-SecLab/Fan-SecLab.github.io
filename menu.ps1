# ============================================================================
#  Fan-SecLab 博客工具箱 —— 数字菜单
#  D:\blog\menu.ps1
#
#  由 启动博客.cmd 调用（powershell -ExecutionPolicy Bypass -File menu.ps1）
#  本文件必须保存为「UTF-8 带 BOM」，否则 Windows PowerShell 5.1 会读成乱码。
# ============================================================================

$ErrorActionPreference = 'Continue'

$ProjectRoot = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $PSCommandPath }
Set-Location -LiteralPath $ProjectRoot

# 让 npm / node 输出的中文正确显示
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}
try { $OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

$Port = 5173
$Url = "http://localhost:$Port/"
$LogDir = Join-Path $ProjectRoot 'logs'
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
$LogFile = Join-Path $LogDir ("menu-{0}.log" -f (Get-Date -Format 'yyyyMMdd'))

# ---------------------------------------------------------------- 小工具
function Write-Log {
    param([string]$Text)
    try { Add-Content -LiteralPath $LogFile -Value ("[{0}] {1}" -f (Get-Date -Format 'HH:mm:ss'), $Text) -Encoding UTF8 } catch {}
}

function Clear-Screen {
    try { Clear-Host } catch { Write-Host ('-' * 66) }
}

function Test-Server {
    try {
        $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        return ($r.StatusCode -eq 200)
    } catch { return $false }
}

function Wait-Server {
    param([int]$Seconds = 60)
    for ($i = 0; $i -lt ($Seconds * 2); $i++) {
        if (Test-Server) { return $true }
        Start-Sleep -Milliseconds 500
    }
    return $false
}

function Get-Posts {
    $file = Join-Path $ProjectRoot 'docs\.vitepress\theme\posts.ts'
    if (-not (Test-Path $file)) { return @() }
    $txt = Get-Content -LiteralPath $file -Raw -Encoding UTF8
    $m = [regex]::Match($txt, 'export const posts: Post\[\] = (\[[\s\S]*?\])\s*\r?\nexport const categories', 'Singleline')
    if (-not $m.Success) { return @() }
    try { return ($m.Groups[1].Value | ConvertFrom-Json) } catch { return @() }
}

function Get-Categories {
    $file = Join-Path $ProjectRoot 'docs\.vitepress\theme\posts.ts'
    if (-not (Test-Path $file)) { return @() }
    $txt = Get-Content -LiteralPath $file -Raw -Encoding UTF8
    $m = [regex]::Match($txt, 'export const categories: Category\[\] = (\[[\s\S]*?\])\s*\r?\nexport const allTags', 'Singleline')
    if (-not $m.Success) { return @() }
    try { return ($m.Groups[1].Value | ConvertFrom-Json) } catch { return @() }
}

function Get-Stats {
    $posts = @(Get-Posts)
    $imgDir = Join-Path $ProjectRoot 'docs\public\assets\images'
    $imgCount = 0
    if (Test-Path $imgDir) { $imgCount = @(Get-ChildItem -LiteralPath $imgDir -Recurse -File -ErrorAction SilentlyContinue).Count }
    $catCount = @($posts | ForEach-Object { $_.category } | Sort-Object -Unique).Count
    $tags = @($posts | ForEach-Object { $_.tags } | Sort-Object -Unique).Count
    return [pscustomobject]@{
        Posts = $posts.Count; Images = $imgCount; Cats = $catCount; Tags = $tags
    }
}

# ---------------------------------------------------------------- 界面
function Show-Header {
    $stats = Get-Stats
    $running = Test-Server
    $state = if ($running) { '运行中  http://localhost:5173' } else { '未运行' }
    $stateColor = if ($running) { 'Green' } else { 'DarkGray' }

    Write-Host ''
    Write-Host '  ╔══════════════════════════════════════════════════════════╗' -ForegroundColor DarkCyan
    Write-Host '  ║            Fan-SecLab 安全笔记博客 · 控制台               ║' -ForegroundColor Cyan
    Write-Host '  ╚══════════════════════════════════════════════════════════╝' -ForegroundColor DarkCyan
    Write-Host ("    项目目录  {0}" -f $ProjectRoot) -ForegroundColor DarkGray
    Write-Host ("    内容概况  {0} 篇文章 · {1} 个分类 · {2} 个标签 · {3} 张图" -f $stats.Posts, $stats.Cats, $stats.Tags, $stats.Images) -ForegroundColor DarkGray
    Write-Host ("    服务状态  {0}" -f $state) -ForegroundColor $stateColor
    Write-Host ''
}

function Show-Menu {
    Write-Host '  ─────────────── 日常 ───────────────' -ForegroundColor DarkGray
    Write-Host '   [1] 启动网站（没跑就启动，跑了就开浏览器）'
    Write-Host '   [2] 只同步内容（加完文章 / 图片后用）'
    Write-Host '   [3] 打开网站（服务需已运行）'
    Write-Host ''
    Write-Host '  ─────────────── 发布 ───────────────' -ForegroundColor DarkGray
    Write-Host '   [4] 构建静态站 → dist\'
    Write-Host '   [5] 构建 + 打包 zip → release\'
    Write-Host '   [6] 预览构建产物（端口 4173）'
    Write-Host '   [13] 一键部署到 GitHub（提交 + 推送，自动上线）' -ForegroundColor Green
    Write-Host ''
    Write-Host '  ─────────────── 查看 / 维护 ─────────' -ForegroundColor DarkGray
    Write-Host '   [7] 查看文章与分类清单'
    Write-Host '   [8] 检查图片缺失'
    Write-Host '   [9] 清理重建（删掉生成物再全量重做）'
    Write-Host '   [10] 安装 / 修复依赖（npm install）'
    Write-Host '   [11] 打开项目文件夹'
    Write-Host '   [12] 打开使用说明'
    Write-Host '   [0] 退出'
    Write-Host ''
}

# ---------------------------------------------------------------- 执行框架
function Invoke-Step {
    param(
        [string]$Label,
        [scriptblock]$Action,
        [string[]]$KeepPattern = @('^[·✓⚠【]', 'build complete', '打包完成', '大小 ', '耗时 ', '缺失', 'Error', 'error', '✖')
    )

    Write-Host ''
    Write-Host ("  ▶ 正在执行：{0}" -f $Label) -ForegroundColor Cyan
    Write-Host ('  ' + ('─' * 60)) -ForegroundColor DarkGray

    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $out = @()
    try {
        $out = @(& $Action 2>&1 | ForEach-Object { $_.ToString() })
        $code = $LASTEXITCODE
        if ($null -eq $code) { $code = 0 }
    } catch {
        $out += $_.Exception.Message
        $code = 1
    }
    $sw.Stop()
    $secs = [math]::Round($sw.Elapsed.TotalSeconds, 1)

    $ok = ($code -eq 0)
    $color = if ($ok) { 'Green' } else { 'Red' }
    $mark = if ($ok) { '✓ 成功' } else { '✗ 失败' }

    # 成功时只显示关键行，失败时显示全部（方便看报错）
    if ($ok) {
        $shown = @($out | Where-Object {
            $line = $_
            ($KeepPattern | Where-Object { $line -match $_ }).Count -gt 0
        })
    } else {
        $shown = @($out | Select-Object -Last 40)
    }

    Write-Host ''
    Write-Host '  ┌────────────── 执行结果 ──────────────' -ForegroundColor $color
    Write-Host ("  │ 动作：{0}" -f $Label) -ForegroundColor $color
    Write-Host ("  │ 状态：{0}（退出码 {1}）" -f $mark, $code) -ForegroundColor $color
    Write-Host ("  │ 用时：{0} 秒" -f $secs) -ForegroundColor $color
    if ($shown.Count) {
        Write-Host '  │ 输出：' -ForegroundColor $color
        foreach ($line in ($shown | Select-Object -First 40)) {
            Write-Host ("  │   {0}" -f $line) -ForegroundColor $color
        }
        if ($shown.Count -gt 40) { Write-Host ("  │   … 其余 {0} 行略" -f ($shown.Count - 40)) -ForegroundColor $color }
    } else {
        Write-Host '  │ 输出：（无）' -ForegroundColor $color
    }
    Write-Host '  └──────────────────────────────────────' -ForegroundColor $color

    Write-Log ("{0} | {1} | exit={2} | {3}s" -f $Label, $mark, $code, $secs)
    return $ok
}

# ---------------------------------------------------------------- 各功能
function Start-Or-OpenSite {
    if (Test-Server) {
        Write-Host '  服务已在运行，先同步一次内容…' -ForegroundColor Yellow
        Invoke-Step -Label '同步内容' -Action { npm.cmd run sync } | Out-Null
        Start-Process $Url
        Write-Host ("  ✓ 已打开 {0}" -f $Url) -ForegroundColor Green
        return
    }

    if (-not (Test-Path (Join-Path $ProjectRoot 'node_modules'))) {
        Write-Host '  首次运行，正在安装依赖…' -ForegroundColor Yellow
        Invoke-Step -Label '安装依赖' -Action { npm.cmd install --no-audit --no-fund } | Out-Null
    }

    Write-Host '  正在新窗口启动服务…' -ForegroundColor Yellow
    Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', "cd /d `"$ProjectRoot`" && npm run dev" | Out-Null

    Write-Host '  等待端口就绪（最多 60 秒）…' -ForegroundColor Yellow
    if (Wait-Server -Seconds 60) {
        Start-Process $Url
        Write-Host ("  ✓ 服务已启动：{0}" -f $Url) -ForegroundColor Green
        Write-Host '    服务跑在新弹出的那个窗口里，关掉它即停止。' -ForegroundColor DarkGray
        Write-Log '启动网站成功'
    } else {
        Write-Host '  ✗ 等不到端口，请看新窗口里的报错' -ForegroundColor Red
        Write-Log '启动网站失败（端口未就绪）'
    }
}

function Open-Site {
    if (Test-Server) {
        Start-Process $Url
        Write-Host ("  ✓ 已打开 {0}" -f $Url) -ForegroundColor Green
    } else {
        Write-Host '  ✗ 网站还没启动 —— 先选 [1] 启动网站' -ForegroundColor Red
    }
}

# ---------------------------------------------------------------- 一键部署
# 从 git remote 推断 owner / repo，进而算出仓库地址、Actions 地址、网站地址，
# 这样仓库改名或换远端都不用改脚本。
function Get-RemoteInfo {
    $url = $null
    try { $url = (git remote get-url origin 2>$null) } catch {}
    if (-not $url) { return $null }
    $clean = ($url.Trim() -replace '\.git$', '')
    if ($clean -match 'github\.com[:/](?<owner>[^/]+)/(?<repo>[^/]+)$') {
        $owner = $Matches['owner']
        $repo = $Matches['repo']
        # 仓库名 == <owner>.github.io 时是根域名站点，否则是 /<repo>/ 项目页
        $isRoot = $false
        if ($repo -ieq ($owner + '.github.io')) { $isRoot = $true }

        # GitHub Pages 域名惯用全小写
        $siteHost = $owner.ToLower()
        $site = 'https://{0}.github.io/' -f $siteHost
        if (-not $isRoot) { $site = 'https://{0}.github.io/{1}/' -f $siteHost, $repo }

        return [pscustomobject]@{
            Owner      = $owner
            Repo       = $repo
            IsRoot     = $isRoot
            RepoUrl    = ('https://github.com/{0}/{1}' -f $owner, $repo)
            ActionsUrl = ('https://github.com/{0}/{1}/actions/workflows/deploy.yml' -f $owner, $repo)
            SiteUrl    = $site
        }
    }
    return $null
}

function Deploy-ToGitHub {
    Write-Host ''
    Write-Host '  ── 一键部署到 GitHub ──' -ForegroundColor Cyan

    if (-not (Test-Path (Join-Path $ProjectRoot '.git'))) {
        Write-Host '  ✗ 当前目录不是 git 仓库（找不到 .git）' -ForegroundColor Red
        Write-Host '    先执行：git init; git branch -M main' -ForegroundColor DarkGray
        Write-Log '部署失败：不是 git 仓库'
        return
    }

    $info = Get-RemoteInfo
    if (-not $info) {
        Write-Host '  ✗ 没有可用的 origin 远端' -ForegroundColor Red
        Write-Host '    先执行：git remote add origin https://github.com/<用户名>/<仓库>.git' -ForegroundColor DarkGray
        Write-Log '部署失败：无 origin'
        return
    }

    # 1) 先同步内容，保证 docs\posts 与 content\ 一致
    Write-Host '  [1/4] 同步内容（content → docs/posts）…' -ForegroundColor Yellow
    Invoke-Step -Label '同步内容' -Action { npm.cmd run sync } | Out-Null

    # 2) 检查改动
    Write-Host ''
    Write-Host '  [2/4] 检查改动…' -ForegroundColor Yellow
    $status = @()
    try { $status = @(git status --porcelain 2>$null) } catch {}
    $changed = @($status | Where-Object { $_.Trim() })

    $emptyCommit = $false
    if ($changed.Count -eq 0) {
        Write-Host '  没有未提交的改动（线上已是最新）。' -ForegroundColor DarkGray
        $ans = Read-Host '  要发一个空提交、强制重新部署一次吗？(y/N)'
        if ($ans -ne 'y' -and $ans -ne 'Y') {
            Write-Host '  已取消。' -ForegroundColor DarkGray
            Write-Log '部署取消：无改动'
            return
        }
        $emptyCommit = $true
    } else {
        Write-Host ("  共 {0} 项有改动：" -f $changed.Count) -ForegroundColor Cyan
        $changed | Select-Object -First 15 | ForEach-Object { Write-Host ("    {0}" -f $_) -ForegroundColor DarkGray }
        if ($changed.Count -gt 15) {
            Write-Host ("    … 其余 {0} 项" -f ($changed.Count - 15)) -ForegroundColor DarkGray
        }
    }

    # 3) 提交说明
    Write-Host ''
    $defaultMsg = '更新博客 {0}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm')
    $msg = Read-Host ("  [3/4] 提交说明（回车用默认：{0}）" -f $defaultMsg)
    if (-not $msg) { $msg = $defaultMsg }

    # 3.5) git 身份兜底：没配过会导致 commit 直接失败（报错还很晦涩）
    $uname = ''
    $uemail = ''
    try { $uname = (git config user.name 2>$null) } catch {}
    try { $uemail = (git config user.email 2>$null) } catch {}
    if (-not $uname -or -not $uemail) {
        $nv = $info.Owner
        $ev = '{0}@users.noreply.github.com' -f $info.Owner
        Write-Host '  未配置 git 身份，已自动设置（仅本仓库）：' -ForegroundColor Yellow
        try { git config user.name $nv } catch {}
        try { git config user.email $ev } catch {}
        Write-Host ("    user.name  = {0}" -f $nv) -ForegroundColor DarkGray
        Write-Host ("    user.email = {0}" -f $ev) -ForegroundColor DarkGray
        Write-Host '    想换成自己的，执行：git config user.email "你的邮箱"' -ForegroundColor DarkGray
    }

    # 4) 提交 + 推送
    Write-Host ''
    Write-Host '  [4/4] 提交并推送…' -ForegroundColor Yellow

    if ($emptyCommit) {
        $ok = Invoke-Step -Label '提交（空提交）' -Action { git commit --allow-empty -m $msg } `
            -KeepPattern @('changed', 'files? changed', 'insertion', 'create mode', '\[main')
    } else {
        $ok = Invoke-Step -Label '暂存 + 提交' -Action { git add -A; git commit -m $msg } `
            -KeepPattern @('changed', 'files? changed', 'insertion', 'deletion', 'create mode', 'rename', '\[main')
    }

    if (-not $ok) {
        Write-Host '  ✗ 提交失败，已中止（没有推送）。' -ForegroundColor Red
        Write-Log '部署失败：提交失败'
        return
    }

    $pushed = Invoke-Step -Label '推送到 GitHub' -Action { git push origin HEAD } `
        -KeepPattern @('^To ', '->', 'up-to-date', 'Enumerating', 'Writing objects', 'Total', 'remote:')

    if (-not $pushed) {
        Write-Host ''
        Write-Host '  ✗ 推送失败，常见原因：' -ForegroundColor Red
        Write-Host '    · 没登录 → 推送时会弹浏览器，直接点授权' -ForegroundColor DarkGray
        Write-Host '    · 要输密码 → GitHub 登录密码无效，要用 Token' -ForegroundColor DarkGray
        Write-Host '      生成：https://github.com/settings/tokens （勾选 repo）' -ForegroundColor DarkGray
        Write-Host '    · 远端有新提交 → 先 git pull --rebase 再试' -ForegroundColor DarkGray
        Write-Log '部署失败：推送失败'
        return
    }

    Write-Host ''
    Write-Host '  ┌────────────── 部署已触发 ──────────────' -ForegroundColor Green
    Write-Host ("  │ 仓库   {0}" -f $info.RepoUrl) -ForegroundColor Green
    Write-Host ("  │ 进度   {0}" -f $info.ActionsUrl) -ForegroundColor Green
    Write-Host ("  │ 网站   {0}" -f $info.SiteUrl) -ForegroundColor Green
    Write-Host '  └────────────────────────────────────────' -ForegroundColor Green
    Write-Host '  GitHub 会在 1~2 分钟内自动构建并发布；去「进度」看 build / deploy 变绿。' -ForegroundColor DarkGray

    $open = Read-Host '  现在打开 Actions 页面看进度吗？(y/N)'
    if ($open -eq 'y' -or $open -eq 'Y') { Start-Process $info.ActionsUrl }

    Write-Log ("部署已触发：{0} | {1}" -f $msg, $info.ActionsUrl)
}

function Show-PostList {
    $posts = @(Get-Posts)
    if (-not $posts.Count) {
        Write-Host '  还没有文章（content\ 目录是空的？）' -ForegroundColor Yellow
        return
    }
    Write-Host ''
    Write-Host ("  共 {0} 篇文章：" -f $posts.Count) -ForegroundColor Cyan

    # 一篇可能属于多个分类：按「分类 × 文章」摊平后再分组
    $flat = foreach ($p in $posts) {
        $cats = @($p.categories)
        if (-not $cats.Count) { $cats = @('未分类') }
        foreach ($c in $cats) { [pscustomobject]@{ Category = $c; Post = $p } }
    }

    $order = @(Get-Categories | ForEach-Object { $_.name })
    $groups = $flat | Group-Object Category | Sort-Object {
        $idx = [array]::IndexOf([string[]]$order, $_.Name)
        if ($idx -lt 0) { 999 } else { $idx }
    }

    foreach ($g in $groups) {
        Write-Host ''
        Write-Host ("  【{0}】{1} 篇" -f $g.Name, $g.Count) -ForegroundColor Yellow
        foreach ($p in ($g.Group.Post | Sort-Object date -Descending)) {
            Write-Host ("    {0}  {1}" -f $p.date, $p.title)
            Write-Host ("                  {0} 字 · 源：content\{1}\" -f $p.words, $p.source) -ForegroundColor DarkGray
        }
    }
    Write-Host ''
    Write-Host '  改分类：编辑上面「源：content\...\」里那个 md 的 front-matter，加一行：' -ForegroundColor Cyan
    Write-Host '          categories: [文件类漏洞, CTF 实战]' -ForegroundColor Cyan
    Write-Host '  然后选 [2] 同步内容。' -ForegroundColor Cyan
    Write-Log '查看文章清单'
}

function Show-Missing {
    $file = Join-Path $ProjectRoot 'scripts\missing-images.json'
    if (-not (Test-Path $file)) {
        Write-Host '  还没有缺失清单（先跑一次 [2] 同步内容）' -ForegroundColor Yellow
        return
    }
    $j = Get-Content -LiteralPath $file -Raw -Encoding UTF8 | ConvertFrom-Json
    Write-Host ''
    Write-Host ("  图片引用  {0} 处" -f $j.totalRefs) -ForegroundColor Cyan
    Write-Host ("  命中      {0} 处" -f $j.resolved) -ForegroundColor Green
    if ($j.missingCount -eq 0) {
        Write-Host '  缺失      0 处  ✓ 图片都齐了' -ForegroundColor Green
    } else {
        Write-Host ("  缺失      {0} 处  ✗" -f $j.missingCount) -ForegroundColor Red
        foreach ($m in @($j.missing | Select-Object -First 15)) { Write-Host ("    - {0}" -f $m) -ForegroundColor Red }
        if ($j.missingCount -gt 15) { Write-Host ("    … 其余 {0} 处略" -f ($j.missingCount - 15)) -ForegroundColor Red }
        Write-Host '  处理：把图片补进对应文章目录，再选 [2] 同步内容' -ForegroundColor Yellow
    }
    Write-Log '检查图片缺失'
}

# ---------------------------------------------------------------- 主循环
Write-Log '===== 打开菜单 ====='

while ($true) {
    Clear-Screen
    Show-Header
    Show-Menu

    $choice = Read-Host '  请输入数字'

    if ($null -eq $choice -or $choice -eq '') { break }
    $choice = $choice.Trim()

    switch ($choice) {
        '1' { Start-Or-OpenSite }
        '2' { Invoke-Step -Label '同步内容' -Action { npm.cmd run sync } | Out-Null }
        '3' { Open-Site }
        '4' { Invoke-Step -Label '构建静态站' -Action { npm.cmd run build } | Out-Null }
        '5' { Invoke-Step -Label '构建 + 打包 zip' -Action { npm.cmd run pack } | Out-Null }
        '6' {
            if (-not (Test-Path (Join-Path $ProjectRoot 'dist\index.html'))) {
                Write-Host '  ✗ 还没有 dist\ —— 先选 [4] 构建' -ForegroundColor Red
            } else {
                Write-Host '  正在启动预览服务器（4173），按 Ctrl+C 停止…' -ForegroundColor Yellow
                $previewUrl = 'http://localhost:4173/'
                Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', "cd /d `"$ProjectRoot`" && npm run preview" | Out-Null
                Start-Sleep -Seconds 3
                Start-Process $previewUrl
                Write-Host ("  ✓ 预览地址：{0}" -f $previewUrl) -ForegroundColor Green
                Write-Host '    预览跑在新窗口里，关掉即停止。' -ForegroundColor DarkGray
                Write-Log '预览 dist'
            }
        }
        '13' { Deploy-ToGitHub }
        '7' { Show-PostList }
        '8' { Show-Missing }
        '9' {
            Write-Host ''
            Write-Host '  这个操作会先删掉生成物，再从 content\ 全量重建：' -ForegroundColor Yellow
            Write-Host '    · 清空 docs\posts\            （24 篇文章的副本）' -ForegroundColor Yellow
            Write-Host '    · 清空 docs\public\assets\images\ （534 张图片副本）' -ForegroundColor Yellow
            Write-Host '    · 然后重新生成，并重新构建 dist\' -ForegroundColor Yellow
            Write-Host '  content\ 里的原稿不会被改动。' -ForegroundColor DarkGray
            $go = Read-Host '  确认执行？(y/N)'
            if ($go -eq 'y' -or $go -eq 'Y') {
                Invoke-Step -Label '清理并重建（--clean）' -Action {
                    npm.cmd run sync -- --clean
                    if ($LASTEXITCODE -eq 0) { npm.cmd run build }
                } | Out-Null
            } else {
                Write-Host '  已取消。' -ForegroundColor DarkGray
                Write-Log '清理重建：用户取消'
            }
        }
        '10' { Invoke-Step -Label '安装依赖' -Action { npm.cmd install --no-audit --no-fund } | Out-Null }
        '11' { Start-Process explorer.exe $ProjectRoot; Write-Host '  ✓ 已打开项目文件夹' -ForegroundColor Green }
        '12' {
            $doc = Join-Path $ProjectRoot '使用说明.md'
            if (Test-Path $doc) { Start-Process $doc; Write-Host '  ✓ 已打开使用说明.md' -ForegroundColor Green }
            else { Write-Host '  ✗ 找不到 使用说明.md' -ForegroundColor Red }
        }
        '0' { break }
        default {
            Write-Host ("  ✗ 没有这个选项：{0}（请输入 0-13）" -f $choice) -ForegroundColor Red
        }
    }

    if ($choice -eq '0') { break }

    Write-Host ''
    Read-Host '  按 Enter 返回菜单' | Out-Null
}

Write-Log '===== 退出菜单 ====='
Clear-Screen
Write-Host ''
Write-Host '  已退出。博客服务如果在别的窗口跑着，关掉那个窗口即可停止。' -ForegroundColor DarkGray
Write-Host ''
