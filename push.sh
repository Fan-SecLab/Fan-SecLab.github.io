#!/bin/bash

# ====================== 固定配置（已按你的环境修改完成） ======================
SSH_KEY="/root/.ssh/blog_key"
REMOTE_NAME="origin"
GIT_REMOTE_URL="git@github.com:Fan-SecLab/Fan-SecLab.github.io.git"
BRANCH="main"
GIT_USER_NAME="Fan-SecLab"
GIT_USER_EMAIL="tacahamucada20@gmail.com"
# ============================================================================

echo "=== 开始自动提交博客（内置配置一键版） ==="

# 配置Git提交用户名、邮箱，消除身份警告
git config user.name "${GIT_USER_NAME}"
git config user.email "${GIT_USER_EMAIL}"

# 加载SSH私钥
echo "→ 加载SSH密钥..."
eval $(ssh-agent -s) > /dev/null 2>&1
ssh-add "${SSH_KEY}" > /dev/null 2>&1
if [ $? -ne 0 ];then
    echo "X SSH密钥加载失败！"
    echo "解决方案：执行命令 ssh-keygen -p -f ${SSH_KEY} 去除私钥密码，两次回车留空新密码"
    exit 1
fi

# 初始化/复用Git仓库
if [ ! -d ".git" ];then
    echo "→ 初始化全新Git仓库"
    git init
    git remote add ${REMOTE_NAME} ${GIT_REMOTE_URL}
else
    echo "→ 复用现有Git仓库，保留提交历史"
fi

# 绑定正确远程地址，防止地址错乱
git remote set-url ${REMOTE_NAME} ${GIT_REMOTE_URL}

# 添加所有变更文件
echo "→ 添加所有变更文件..."
git add -A

# 生成提交记录
commit_time=$(date "+%Y-%m-%d %H:%M:%S")
git commit -m "博客自动更新：${commit_time}"

# 强制推送远程并绑定上游分支
echo "→ 强制推送到远程并绑定上游分支 ..."
git push -f --set-upstream ${REMOTE_NAME} ${BRANCH}

# 推送结果判断
if [ $? -eq 0 ];then
    echo "✅ 推送成功！博客已完成更新"
else
    echo "ERROR: Repository not found."
    echo "fatal: Could not read from remote repository."
    echo ""
    echo "X 推送失败，请检查："
    echo "1. SSH私钥已去除密码，权限执行 chmod 600 ${SSH_KEY}"
    echo "2. 公钥已添加至GitHub账号SSH密钥"
    echo "3. 仓库SSH地址填写正确"
    exit 2
fi
