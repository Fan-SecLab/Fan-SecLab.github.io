#!/bin/bash
# 移除全局set -e，避免单条命令失败直接杀脚本
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

# ========== 前置：100%兜底修复仓库，杜绝周期性损坏 ==========
info "1. 前置校验Git仓库完整性"
# 第一步：清空所有Git锁，解决残留锁导致无法锁定HEAD
rm -rf .git/*.lock .git/refs/heads/*.lock .git/index.lock .git/HEAD.lock

# 判断仓库是否彻底损坏（无法识别HEAD/不是合法仓库）
if [ ! -d ".git" ] || ! git rev-parse --is-inside-work-tree >/dev/null 2>&1 || ! git rev-parse HEAD >/dev/null 2>&1; then
    err "仓库损坏/HEAD丢失，完全重建.git目录，防止后续报错"
    rm -rf .git
    git init
    git config --local user.name "$USER_NAME"
    git config --local user.email "$USER_EMAIL"
    # 强制生成初始空提交，构建完整合法HEAD、分支引用
    git commit --allow-empty -m "Auto base init commit" >/dev/null 2>&1
fi

# ========== 2. 安全清理SSH代理，避免进程崩溃中断脚本 ==========
info "2. 清理残留SSH代理进程"
# 静默杀掉所有旧ssh-agent，不报错
pkill ssh-agent 2>/dev/null || true
# 新建代理，捕获PID
eval "$(ssh-agent -s)" >/dev/null 2>&1
AGENT_PID=$SSH_AGENT_PID
# trap只在脚本正常退出时杀代理，异常中断不破坏Git流程
trap 'kill $AGENT_PID 2>/dev/null; exit $?' EXIT INT TERM

# 修复私钥权限并加载
chmod 600 "$SSH_KEY"
ssh-add "$SSH_KEY" >/dev/null 2>&1

# ========== 3. 远程origin配置 ==========
info "3. 校验远程仓库地址"
if ! git remote | grep -q "^$REMOTE$"; then
    git remote add "$REMOTE" "$REMOTE_URL"
    info "已新建origin远程仓库"
else
    git remote set-url "$REMOTE" "$REMOTE_URL"
    info "已更新origin远程地址"
fi

# ========== 4. 本地Git用户信息 ==========
info "4. 校验Git提交用户信息"
git config --local user.name "$USER_NAME"
git config --local user.email "$USER_EMAIL"

# ========== 5. 检测文件变更 ==========
info "5. 扫描本地文件变更"
git add -A
TIME=$(date "+%Y-%m-%d %H:%M:%S")

# 无文件修改直接退出，不执行提交推送
if git diff --cached --quiet; then
    info "本地无文件更新，无需推送，脚本结束"
    exit 0
fi

# ========== 6. 提交并推送，容错执行 ==========
info "6. 提交本地文件更新"
git commit -m "博客自动更新: $TIME" || {
    err "提交失败，跳过推送"
    exit 1
}
info "7. 强制推送至GitHub $BRANCH 分支"
git push -f --set-upstream "$REMOTE" "$BRANCH" || {
    err "推送远程仓库失败"
    exit 1
}
ok "博客代码推送完成，无异常！"

exit 0
