#!/bin/bash
SSH_KEY="/root/.ssh/blog_key"
REMOTE_NAME="origin"
GIT_REMOTE_URL="git@github.com:Fan-SecLab/Fan-SecLab.github.io.git"
BRANCH="master"

echo "=== 开始自动提交博客（master默认分支版） ==="

# 加载免密SSH密钥
echo "→ 加载SSH密钥..."
eval $(ssh-agent -s) > /dev/null 2>&1
ssh-add "${SSH_KEY}" > /dev/null 2>&1
if [ $? -ne 0 ];then
    echo "X SSH密钥加载失败，请执行：chmod 600 ${SSH_KEY}"
    exit 1
fi

# 确保远程地址正确
git remote set-url ${REMOTE_NAME} ${GIT_REMOTE_URL}

# 提交所有修改
echo "→ 提交全部变更文件"
git add -A
commit_time=$(date "+%Y-%m-%d %H:%M:%S")
git commit -m "博客自动更新：${commit_time}"

# 强制推送到默认master分支
echo "→ 推送到远程默认master分支"
git push -f --set-upstream ${REMOTE_NAME} ${BRANCH}

if [ $? -eq 0 ];then
    echo "✅ 推送成功，博客已更新至GitHub默认master分支"
else
    echo "❌ 推送失败，请检查SSH密钥、仓库地址"
    exit 2
fi
