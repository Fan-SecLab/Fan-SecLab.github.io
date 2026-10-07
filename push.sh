#!/bin/bash
# 容错模式，单命令失败不直接退出
set -uo pipefail
IFS=$'\n\t'
# ========== 固定配置 ==========
SSH_KEY="/root/.ssh/blog_key"
REMOTE="origin"
REMOTE_URL="git@github.com:Fan-SecLab/Fan-SecLab.github.io.git"
BRANCH="master"
USER_NAME="Fan-SecLab"
USER_EMAIL="tacahamucada20@gmail.com"
# ========== 彩色日志函数 ==========
info() { echo -e "\033[033m→ $1\033[0m"; }
err()  { echo -e "\033[31m✘ $1\033[0m" >&2; }
ok()   { echo -e "\033[32m✅ $1\033[0m"; }

# ========== 前置：深度修复Git仓库（新增远程引用修复） ==========
info "1. 前置：清理全部Git残留锁文件"
# 清理所有层级锁：本地分支、远程追踪、索引、HEAD锁
rm -rf .git/*.lock .git/index.lock .git/HEAD.lock
rm -rf .git/refs/heads/*.lock .git/refs/remotes/origin/*.lock

# 校验是否合法Git仓库，损坏直接重建
if [ ! -d ".git" ] || ! git rev-parse --is-inside-work-tree >/dev/null 2>&1 || ! git rev-parse HEAD >/dev/null 2>&1; then
    err "仓库HEAD损坏，重建.git目录"
    rm -rf .git
    git init
    git config --local user.name "$USER_NAME"
    git config --local user.email "$USER_EMAIL"
    git commit --allow-empty -m "Auto base init commit" >/dev/null 2>&1
fi

# 【新增核心修复：清理损坏远程追踪引用】
info "1.1 清理损坏远程分支缓存，重建refs/remotes"
# 删除远程追踪分支文件 + 打包引用缓存
rm -rf .git/refs/remotes/origin/
rm -f .git/packed-refs
# 拉取远端并修剪无效分支，重建完整origin/master引用
git fetch "$REMOTE" --prune >/dev/null 2>&1
# 仓库垃圾回收，修复碎片与损坏对象
git gc --prune=now >/dev/null 2>&1

# ========== 2. 安全SSH代理管理 ==========
info "2. 清理残留SSH代理进程"
pkill ssh-agent 2>/dev/null || true
eval "$(ssh-agent -s)" >/dev/null 2>&1
AGENT_PID=$SSH_AGENT_PID
# 脚本退出自动销毁ssh-agent
trap 'kill $AGENT_PID 2>/dev/null; exit $?' EXIT INT TERM
chmod 600 "$SSH_KEY"
ssh-add "$SSH_KEY" >/dev/null 2>&1

# ========== 3. 校验远程仓库配置 ==========
info "3. 校验origin远程地址"
if ! git remote | grep -q "^$REMOTE$"; then
    git remote add "$REMOTE" "$REMOTE_URL"
    info "新建origin远程仓库"
else
    git remote set-url "$REMOTE" "$REMOTE_URL"
    info "更新origin远程地址"
fi

# ========== 4. 本地提交用户信息 ==========
info "4. 配置本地Git提交用户"
git config --local user.name "$USER_NAME"
git config --local user.email "$USER_EMAIL"

# ========== 5. 检测文件变更 ==========
info "5. 扫描本地文件变更"
git add -A
TIME=$(date "+%Y-%m-%d %H:%M:%S")
# 无变更直接退出
if git diff --cached --quiet; then
    info "本地无更新，脚本结束"
    exit 0
fi

# ========== 6. 提交+强制推送 ==========
info "6. 提交本地更新"
git commit -m "博客自动更新: $TIME" || {
    err "提交失败，终止推送"
    exit 1
}
info "7. 强制推送至 $REMOTE/$BRANCH"
git push -f --set-upstream "$REMOTE" "$BRANCH" || {
    err "推送GitHub失败"
    exit 1
}
ok "博客代码推送完成，无异常！"
exit 0
