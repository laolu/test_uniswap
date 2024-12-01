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
    <nav className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-1">
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
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
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