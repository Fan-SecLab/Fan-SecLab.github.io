#!/bin/bash
# 临时关闭全局-e，仓库修复阶段容错
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

# ========== 1. 兜底完整重建仓库（根治HEAD报错） ==========
info "1. 检测并修复破损Git仓库"
# 检测仓库是否完全失效
if [ ! -d ".git" ] || ! git rev-parse --is-inside-work-tree >/dev/null 2>&1 || ! git rev-parse HEAD >/dev/null 2>&1; then
    err "仓库损坏/HEAD失效，完整重建.git目录"
    rm -rf .git
    git init
    git config --local user.name "$USER_NAME"
    git config --local user.email "$USER_EMAIL"
    # 强制生成初始空提交，构建合法HEAD与分支
    git commit --allow-empty -m "Auto init base commit" >/dev/null 2>&1
fi

# 清理全部锁文件
rm -f .git/*.lock .git/refs/heads/*.lock .git/index.lock .git/HEAD.lock

# ========== 2. 清理SSH代理 ==========
info "2. 清理残留SSH代理进程"
pkill ssh-agent 2>/dev/null || true
eval "$(ssh-agent -s)" >/dev/null 2>&1
AGENT_PID=$SSH_AGENT_PID
trap 'kill $AGENT_PID 2>/dev/null' EXIT INT TERM

chmod 600 "$SSH_KEY"
ssh-add "$SSH_KEY" >/dev/null 2>&1

# ========== 3. 远程仓库配置 ==========
info "3. 校验远程仓库配置"
if ! git remote | grep -q "^$REMOTE$"; then
    git remote add "$REMOTE" "$REMOTE_URL"
    info "已新建origin远程"
else
    git remote set-url "$REMOTE" "$REMOTE_URL"
    info "已更新origin地址"
fi

# ========== 4. Git本地用户信息 ==========
info "4. 校验Git用户信息"
git config --local user.name "$USER_NAME"
git config --local user.email "$USER_EMAIL"

# ========== 5. 文件变更扫描 ==========
info "5. 扫描文件变更"
git add -A
TIME=$(date "+%Y-%m-%d %H:%M:%S")

# 无变更直接退出
if git diff --cached --quiet; then
    info "无文件更新，无需推送，结束"
    exit 0
fi

# ========== 6. 提交+推送 ==========
info "6. 提交更新"
git commit -m "博客自动更新: $TIME"
info "7. 推送至GitHub $BRANCH"
git push -f --set-upstream "$REMOTE" "$BRANCH"
ok "博客推送成功！"

exit 0
