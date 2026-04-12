#!/bin/bash

# ==============================================================================
# Supabase Smart Startup Script
# 
# 目的: 自动检测并修复由于关机或 Docker 异常导致的 "僵尸状态" (Container Exited but CLI thinks it's running)
# ==============================================================================

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}==> 正在检查 Supabase 本地环境状态...${NC}"

# 获取当前状态并捕获错误
# 注意：我们不直接 set -e 因为我们需要捕获失败的情况
if supabase start; then
    echo -e "${GREEN}✔ Supabase 已成功启动！${NC}"
else
    EXIT_CODE=$?
    echo -e "${YELLOW}! 检测到启动异常 (Exit Code: $EXIT_CODE)，尝试自动修复同步状态...${NC}"
    
    # 执行快速重置
    echo -e "${YELLOW}正在执行快速重置 (supabase stop --no-backup)...${NC}"
    supabase stop --no-backup
    
    echo -e "${GREEN}正在重新尝试启动...${NC}"
    if supabase start; then
        echo -e "${GREEN}✔ 已通过自动修复成功启动 Supabase！${NC}"
    else
        echo -e "${RED}✘ 启动失败。请检查 Docker 是否正常运行，或运行 'supabase start --debug' 查看详情。${NC}"
        exit 1
    fi
fi
