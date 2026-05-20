#!/bin/bash

# ======================================
# 博客自动提交脚本（终极修复版）
# 彻底解决 HEAD 损坏、分离头指针、无分支问题
# ======================================

# -------------------- 配置区 --------------------
SSH_KEY="/root/FanSecLab/Fan-SecLab.github.io-master/key"
BRANCH="main"
REMOTE_NAME="origin"
GIT_REMOTE_URL="git@github.com:Fan-SecLab/Fan-SecLab.github.io.git"
# ------------------------------------------------

# 颜色输出
RED="\033[31m"
GREEN="\033[32m"
YELLOW="\033[33m"
RES="\033[0m"

echo -e "${YELLOW}=== 开始自动提交博客（修复版） ===${RES}"

# 1. 加载SSH密钥
echo -e "${YELLOW}→ 加载SSH密钥...${RES}"
eval $(ssh-agent -s) > /dev/null 2>&1
ssh-add "$SSH_KEY" > /dev/null 2>&1

# 2. 强制修复损坏的Git仓库（核心步骤）
echo -e "${YELLOW}→ 强制修复Git仓库...${RES}"
rm -rf .git
git init
git remote add "$REMOTE_NAME" "$GIT_REMOTE_URL"

# 3. 添加所有文件
echo -e "${YELLOW}→ 添加所有文件...${RES}"
git add -A

# 4. 强制提交（即使仓库是空的也能提交）
echo -e "${YELLOW}→ 强制提交...${RES}"
git commit -m "博客自动初始化更新：$(date +'%Y-%m-%d %H:%M:%S')"

# 5. 创建/切换到目标分支
echo -e "${YELLOW}→ 创建分支 $BRANCH ...${RES}"
git branch -M "$BRANCH"

# 6. 强制推送覆盖远程分支
echo -e "${YELLOW}→ 强制推送到GitHub...${RES}"
git push -f "$REMOTE_NAME" "$BRANCH"

# 7. 结果判断
if [ $? -eq 0 ]; then
    echo -e "${GREEN}☑ 推送成功！博客已更新${RES}"
else
    echo -e "${RED}✗ 推送失败，请检查SSH密钥、网络或仓库权限${RES}"
    exit 1
fi
