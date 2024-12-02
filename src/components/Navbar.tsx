'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { 
  Moon, 
  Sun, 
  ArrowLeftRight, 
  Timer, 
  SendHorizontal, 
  CreditCard,
  ChevronDown,
  Search,
  LineChart
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const pathname = usePathname();
  const [showTradeMenu, setShowTradeMenu] = useState(false);
  const [showExploreMenu, setShowExploreMenu] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const exploreMenuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => pathname === path;

  // 处理点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 交易菜单
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        !event.target?.closest('button')?.contains(event.target as Node)
      ) {
        setShowTradeMenu(false);
      }
      
      // 探索菜单
      if (
        exploreMenuRef.current && 
        !exploreMenuRef.current.contains(event.target as Node) &&
        !event.target?.closest('button')?.contains(event.target as Node)
      ) {
        setShowExploreMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 h-[72px] flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold">
            Web3 DEX
          </Link>
          <div className="flex items-center gap-6">
            {/* 交易菜单 */}
            <div className="relative">
              <button
                onClick={() => setShowTradeMenu(!showTradeMenu)}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 ${
                  pathname.startsWith('/trade') ? 'bg-gray-100 dark:bg-gray-800 font-medium' : ''
                }`}
              >
                交易
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showTradeMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {/* 交易子菜单 */}
              <div
                ref={menuRef}
                className={`absolute z-50 top-full left-0 mt-2 w-56 rounded-2xl shadow-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 py-2 backdrop-blur-xl transition-all duration-200 origin-top ${
                  showTradeMenu 
                    ? 'opacity-100 scale-100 translate-y-0' 
                    : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                }`}
              >
                {[
                  { href: '/trade/swap', icon: <ArrowLeftRight className="h-4 w-4" />, text: '兑换' },
                  { href: '/trade/limit', icon: <Timer className="h-4 w-4" />, text: '限额' },
                  { href: '/trade/send', icon: <SendHorizontal className="h-4 w-4" />, text: '发送' },
                  { href: '/trade/buy', icon: <CreditCard className="h-4 w-4" />, text: '购买' }
                ].map((item) => (
                  <Link 
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                      isActive(item.href) ? 'bg-gray-100 dark:bg-gray-800 font-medium' : ''
                    }`}
                  >
                    {item.icon}
                    {item.text}
                  </Link>
                ))}
              </div>
            </div>
            
            {/* 探索菜单 */}
            <div className="relative">
              <button
                onClick={() => setShowExploreMenu(!showExploreMenu)}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 ${
                  pathname.startsWith('/explore') ? 'bg-gray-100 dark:bg-gray-800 font-medium' : ''
                }`}
              >
                探索
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showExploreMenu ? 'rotate-180' : ''}`} />
              </button>
              
              <div
                ref={exploreMenuRef}
                className={`absolute z-50 top-full left-0 mt-2 w-56 rounded-2xl shadow-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 py-2 backdrop-blur-xl transition-all duration-200 origin-top ${
                  showExploreMenu 
                    ? 'opacity-100 scale-100 translate-y-0' 
                    : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                }`}
              >
                {[
                  { 
                    href: '/explore/tokens', 
                    icon: <Search className="h-4 w-4" />, 
                    text: '代币',
                    description: '查找任意代币的价格和数据'
                  },
                  { 
                    href: '/explore/pools', 
                    icon: <LineChart className="h-4 w-4" />, 
                    text: '资金池',
                    description: '查看所有流动性池的数据'
                  },
                  { 
                    href: '/explore/transactions', 
                    icon: <ArrowLeftRight className="h-4 w-4" />, 
                    text: '交易',
                    description: '查看最新的交易记录'
                  }
                ].map((item) => (
                  <Link 
                    key={item.href}
                    href={item.href}
                    className={`flex flex-col gap-1 mx-2 px-3 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                      isActive(item.href) ? 'bg-gray-100 dark:bg-gray-800' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span className="font-medium">{item.text}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 pl-7">
                      {item.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            {/* 资金池链接 */}
            <Link 
              href="/pools/positions" 
              className={`px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                pathname.startsWith('/pools') ? 'bg-gray-100 dark:bg-gray-800 font-medium' : ''
              }`}
            >
              资金池
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <ConnectButton />
        </div>
      </div>
    </nav>
  );
} 