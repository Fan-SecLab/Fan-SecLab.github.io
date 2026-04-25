#!/bin/bash

# 自动加载 SSH 密钥（解决每次都要手动 ssh-add 的问题）
eval $(ssh-agent -s) > /dev/null 2>&1
ssh-add /root/FanSecLab/Fan-SecLab.github.io-master/key > /dev/null 2>&1

# 颜色输出（更美观）
RED="\033[31m"
GREEN="\033[32m"
YELLOW="\033[33m"
RES="\033[0m"

echo -e "${YELLOW}=== 开始自动提交博客 ===${RES}"

# 检查是否有文件变更
CHANGE=$(git status --porcelain)
if [ -z "$CHANGE" ]; then
    echo -e "${RED}⚠️ 没有检测到任何文件变更，退出${RES}"
    exit 0
fi

# 添加所有文件
echo -e "${YELLOW}→ 添加所有文件...${RES}"
git add -A

# 提交
echo -e "${YELLOW}→ 生成提交记录...${RES}"
git commit -m "博客自动更新：$(date +'%Y-%m-%d %H:%M:%S')"

# 推送到 GitHub（走 443 端口，不会失败）
echo -e "${YELLOW}→ 推送到 GitHub...${RES}"
git push origin master

# 判断结果
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 推送成功！博客已更新${RES}"
else
    echo -e "${RED}❌ 推送失败，请检查网络或权限${RES}"
fi
