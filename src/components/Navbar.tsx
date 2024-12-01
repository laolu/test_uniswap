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
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [showTradeMenu, setShowTradeMenu] = useState(false);
  const [showExploreMenu, setShowExploreMenu] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const exploreMenuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => pathname === path;

  const menuVariants = {
    hidden: { 
      opacity: 0,
      y: 0,
      scaleY: 0.8,
      scaleX: 0.9,
      transformOrigin: 'top'
    },
    visible: { 
      opacity: 1,
      y: 0,
      scaleY: 1,
      scaleX: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
        duration: 0.15
      }
    },
    exit: {
      opacity: 0,
      y: 0,
      scaleY: 0.8,
      scaleX: 0.9,
      transition: {
        duration: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: (i: number) => ({
      opacity: 1,
      transition: {
        delay: i * 0.03,
        duration: 0.1
      }
    }),
    exit: { opacity: 0 }
  };

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
              <motion.button
                onClick={() => setShowTradeMenu(!showTradeMenu)}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                  pathname.startsWith('/trade') ? 'bg-gray-100 dark:bg-gray-800 font-medium' : ''
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                交易
                <motion.div
                  animate={{ rotate: showTradeMenu ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </motion.button>
              
              {/* 交易子菜单 */}
              <AnimatePresence>
                {showTradeMenu && (
                  <motion.div
                    ref={menuRef}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={menuVariants}
                    className="absolute z-50 top-full left-0 mt-2 w-56 rounded-2xl shadow-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 py-2 backdrop-blur-xl"
                  >
                    {[
                      { href: '/trade/swap', icon: <ArrowLeftRight className="h-4 w-4" />, text: '兑换' },
                      { href: '/trade/limit', icon: <Timer className="h-4 w-4" />, text: '限额' },
                      { href: '/trade/send', icon: <SendHorizontal className="h-4 w-4" />, text: '发送' },
                      { href: '/trade/buy', icon: <CreditCard className="h-4 w-4" />, text: '购买' }
                    ].map((item, i) => (
                      <motion.div
                        key={item.href}
                        custom={i}
                        variants={itemVariants}
                      >
                        <Link 
                          href={item.href}
                          className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                            isActive(item.href) ? 'bg-gray-100 dark:bg-gray-800 font-medium' : ''
                          }`}
                        >
                          {item.icon}
                          {item.text}
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* 探索菜单 */}
            <div className="relative">
              <motion.button
                onClick={() => setShowExploreMenu(!showExploreMenu)}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                  pathname.startsWith('/explore') ? 'bg-gray-100 dark:bg-gray-800 font-medium' : ''
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                探索
                <motion.div
                  animate={{ rotate: showExploreMenu ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </motion.button>
              
              <AnimatePresence>
                {showExploreMenu && (
                  <motion.div
                    ref={exploreMenuRef}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={menuVariants}
                    className="absolute z-50 top-full left-0 mt-2 w-56 rounded-2xl shadow-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 py-2 backdrop-blur-xl"
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
                    ].map((item, i) => (
                      <motion.div
                        key={item.href}
                        custom={i}
                        variants={itemVariants}
                      >
                        <Link 
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
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 资金池链接 */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link 
                href="/pools/positions" 
                className={`px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                  pathname.startsWith('/pools') ? 'bg-gray-100 dark:bg-gray-800 font-medium' : ''
                }`}
              >
                资金池
              </Link>
            </motion.div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <motion.button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </motion.button>
          <ConnectButton />
        </div>
      </div>
    </nav>
  );
} 