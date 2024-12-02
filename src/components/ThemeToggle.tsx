'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // 等待组件挂载后再渲染，避免服务器端和客户端渲染不匹配
  useEffect(() => {
    setMounted(true)
  }, [])

  // 在未挂载时返回一个占位按钮，保持布局稳定
  if (!mounted) {
    return (
      <div className="w-9 h-9 p-2 rounded-lg bg-slate-100 dark:bg-slate-800" />
    )
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 transition-all duration-200 hover:scale-105 active:scale-95"
      aria-label={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
    >
      {mounted && (
        <>
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-slate-600" />
          ) : (
            <Moon className="h-5 w-5 text-slate-600" />
          )}
        </>
      )}
    </button>
  )
} 