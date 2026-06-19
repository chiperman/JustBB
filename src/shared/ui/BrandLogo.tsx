"use client"

import React from "react"
import { cn } from "@/shared/lib/utils"

interface BrandLogoProps {
  className?: string
  pixelSize?: number // 像素格的大小，默认 3px
}

export function BrandLogo({ className, pixelSize = 3 }: BrandLogoProps) {
  // 定义每个字母的 5x7 像素网格数据 (1 表示有色，0 表示无色)
  const letters: Record<string, number[][]> = {
    J: [
      [0, 0, 1, 1, 1],
      [0, 0, 0, 1, 0],
      [0, 0, 0, 1, 0],
      [0, 0, 0, 1, 0],
      [1, 0, 0, 1, 0],
      [1, 0, 0, 1, 0],
      [0, 1, 1, 0, 0],
    ],
    u: [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [0, 1, 1, 1, 0],
    ],
    s: [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 1, 1, 1, 0],
      [1, 0, 0, 0, 0],
      [0, 1, 1, 1, 0],
      [0, 0, 0, 0, 1],
      [0, 1, 1, 1, 0],
    ],
    t: [
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [1, 1, 1, 1, 1],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 0, 1, 1],
    ],
    B: [
      [1, 1, 1, 1, 0],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 0],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 0],
    ],
  }

  const wordOrder = ["J", "u", "s", "t", "B", "B"] as const
  const charWidth = 5
  const charHeight = 7
  const letterSpacing = 1 // 字符间距

  // 计算 SVG 的画布尺寸：6 个字符 + 5 个间距
  const totalCols = charWidth * 6 + letterSpacing * 5
  const totalRows = charHeight

  const width = totalCols * pixelSize
  const height = totalRows * pixelSize

  // 渲染所有像素矩形
  const rects: React.ReactNode[] = []

  // 1. 渲染品牌字 "JustBB"
  wordOrder.forEach((char, charIndex) => {
    const grid = letters[char]
    const xOffset = charIndex * (charWidth + letterSpacing)

    for (let r = 0; r < charHeight; r++) {
      for (let c = 0; c < charWidth; c++) {
        if (grid[r][c] === 1) {
          rects.push(
            <rect
              key={`${char}-${charIndex}-${r}-${c}`}
              x={(xOffset + c) * pixelSize}
              y={r * pixelSize}
              width={pixelSize}
              height={pixelSize}
              className="fill-current"
            />
          )
        }
      }
    }
  })

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("text-foreground", className)}
      aria-label="JustBB"
      role="img"
    >
      {rects}
    </svg>
  )
}
