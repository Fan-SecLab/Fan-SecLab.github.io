#!/bin/bash

# 检查是否有文件变更
if git status --porcelain | grep -q .; then
    echo "🔍 检测到文件变更，准备提交..."
else
    echo "ℹ️ 没有文件变更，无需提交"
    exit 0
fi

# 提交所有变更
git add -A
git commit -m "更新博客：$(date +'%Y-%m-%d %H:%M:%S')"

# 推送到远程
git push -u origin master --force

if [ $? -eq 0 ]; then
    echo "✅ 推送成功！博客已更新！"
else
    echo "❌ 推送失败，请检查错误"
    exit 1
fi
