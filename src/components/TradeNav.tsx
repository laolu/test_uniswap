'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowDownUp, ArrowRight, Timer, Wallet } from 'lucide-react'

const TRADE_ROUTES = [
  { 
    path: '/trade/swap', 
    label: '兑换',
    icon: <ArrowDownUp className="w-4 h-4" />
  },
  { 
    path: '/trade/limit', 
    label: '限价',
    icon: <Timer className="w-4 h-4" />
  },
  { 
    path: '/trade/send', 
    label: '发送',
    icon: <ArrowRight className="w-4 h-4" />
  },
  { 
    path: '/trade/buy', 
    label: '购买',
    icon: <Wallet className="w-4 h-4" />
  },
]

export default function TradeNav() {
  const pathname = usePathname()

  return (
    <nav className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800/80 p-1.5">
      <div className="flex">
        {TRADE_ROUTES.map(({ path, label, icon }) => (
          <Link
            key={path}
            href={path}
            className={`
              flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-xl font-medium text-sm
              transition-all duration-200
              ${
                pathname === path
                  ? 'bg-pink-500/10 dark:bg-pink-500/20 text-pink-500 dark:text-pink-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }
            `}
          >
            {icon}
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
} 