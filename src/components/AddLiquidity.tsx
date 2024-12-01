'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAccount, useContractWrite, usePrepareContractWrite, useContractRead } from 'wagmi'
import { ArrowDown, ArrowUpDown, ArrowLeft } from 'lucide-react'
import TokenSelector from './TokenSelector'
import { useRouter } from 'next/navigation'
import { addInitialLiquidity } from '@/services/uniswap'
import { Token } from '@/constants/tokens'
import { ERC20_ABI } from '@/constants/abis'
import { formatUnits } from 'viem'

interface ExtendedToken extends Token {
  balance?: string
}

// 添加格式化余额的辅助函数
const formatBalance = (balance: string) => {
  const num = parseFloat(balance)
  if (num > 1000000) {
    return `${(num / 1000000).toFixed(2)}M`
  } else if (num > 1000) {
    return `${(num / 1000).toFixed(2)}K`
  }
  return num.toFixed(4)
}

export default function AddLiquidity() {
  const { address, isConnected } = useAccount()
  const [token0Amount, setToken0Amount] = useState('')
  const [token1Amount, setToken1Amount] = useState('')
  const [token0, setToken0] = useState<ExtendedToken | null>(null)
  const [token1, setToken1] = useState<ExtendedToken | null>(null)
  const [isToken0SelectorOpen, setIsToken0SelectorOpen] = useState(false)
  const [isToken1SelectorOpen, setIsToken1SelectorOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const { data: token0Balance } = useContractRead({
    address: token0?.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    enabled: !!token0?.address && !!address,
    watch: true,
  })

  const { data: token1Balance } = useContractRead({
    address: token1?.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    enabled: !!token1?.address && !!address,
    watch: true,
  })

  useEffect(() => {
    if (token0 && token0Balance && token0.balance === undefined) {
      try {
        const formattedBalance = formatUnits(token0Balance as bigint, token0.decimals)
        setToken0(prev => {
          if (prev?.balance === formattedBalance) return prev
          return {
            ...prev!,
            balance: formattedBalance
          }
        })
      } catch (error) {
        console.error('格式化 token0 余额错误:', error)
      }
    }
  }, [token0Balance, token0?.address])

  useEffect(() => {
    if (token1 && token1Balance && token1.balance === undefined) {
      try {
        const formattedBalance = formatUnits(token1Balance as bigint, token1.decimals)
        setToken1(prev => {
          if (prev?.balance === formattedBalance) return prev
          return {
            ...prev!,
            balance: formattedBalance
          }
        })
      } catch (error) {
        console.error('格式化 token1 余额错误:', error)
      }
    }
  }, [token1Balance, token1?.address])

  const handleSwapTokens = () => {
    const tempToken = token0
    setToken0(token1)
    setToken1(tempToken)

    const tempAmount = token0Amount
    setToken0Amount(token1Amount)
    setToken1Amount(tempAmount)
  }

  const handleSubmit = async () => {
    if (!token0?.address || !token1?.address || !token0Amount || !token1Amount || !address) {
      console.log('Missing required parameters:', { 
        token0Address: token0?.address, 
        token1Address: token1?.address, 
        token0Amount, 
        token1Amount, 
        address 
      })
      return
    }

    if (!token0.balance || !token1.balance) {
      console.error('无法读取代币余额')
      return
    }

    const token0BalanceNum = parseFloat(token0.balance)
    const token1BalanceNum = parseFloat(token1.balance)
    const token0AmountNum = parseFloat(token0Amount)
    const token1AmountNum = parseFloat(token1Amount)

    if (token0AmountNum > token0BalanceNum || token1AmountNum > token1BalanceNum) {
      console.error('余额不足')
      return
    }
    
    try {
      setIsSubmitting(true)
      
      await addInitialLiquidity(
        token0,
        token1,
        token0Amount,
        token1Amount,
        address
      )

      router.push('/pools/positions')

    } catch (error) {
      console.error('添加流动性详细错误:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 mb-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>返回</span>
      </button> 

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">添加头寸</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            向流动性池添加代币以赚取交易费用
          </p>
        </div>

        {/* 第一���代币输入 */}
        <div className="mb-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-500 dark:text-gray-400">
                输入
              </label>
              {token0 && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  余额: {formatBalance(token0.balance || '0')} {token0.symbol}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={token0Amount}
                onChange={(e) => setToken0Amount(e.target.value)}
                placeholder="0.0"
                disabled={!token0}
                className={`w-full bg-transparent text-2xl outline-none ${
                  !token0 ? 'cursor-not-allowed text-gray-400' : ''
                }`}
              />
              <button
                onClick={() => setIsToken0SelectorOpen(true)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {token0 ? token0.symbol : '选择代币'}
              </button>
            </div>
          </div>
        </div>

        {/* 交换按钮 */}
        <div className="flex justify-center -my-2 relative z-10">
          <button
            onClick={handleSwapTokens}
            disabled={!token0 || !token1}
            className={`bg-gray-100 dark:bg-gray-900 p-2 rounded-xl transition-colors ${
              token0 && token1 
                ? 'hover:bg-gray-200 dark:hover:bg-gray-700' 
                : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <ArrowUpDown className="h-6 w-6" />
          </button>
        </div>

        {/* 第二个代币输入 */}
        <div className="mb-6">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-500 dark:text-gray-400">
                输入
              </label>
              {token1 && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  余额: {formatBalance(token1.balance || '0')} {token1.symbol}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={token1Amount}
                onChange={(e) => setToken1Amount(e.target.value)}
                placeholder="0.0"
                disabled={!token1}
                className={`w-full bg-transparent text-2xl outline-none ${
                  !token1 ? 'cursor-not-allowed text-gray-400' : ''
                }`}
              />
              <button
                onClick={() => setIsToken1SelectorOpen(true)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {token1 ? token1.symbol : '选择代币'}
              </button>
            </div>
          </div>
        </div>

        {/* 价格和流动性信息 */}
        {token0 && token1 && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                价格
              </span>
              <span>
                1 {token0.symbol} = {/* 计算价格 */} {token1.symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                份额
              </span>
              <span>
                {/* 计算份额百分比 */}0.00%
              </span>
            </div>
          </div>
        )}

        {/* 提交按钮组 */}
        <div className="space-y-3">
          <button
            onClick={handleSubmit}
            disabled={
              !token0 || 
              !token1 || 
              !token0Amount || 
              !token1Amount || 
              isSubmitting
            }
            className="w-full py-4 bg-blue-500 dark:bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-white">
              {isSubmitting
                ? '提交中...'
                : '添加流动性'
              }
            </span>
          </button>

          {/* 价格和滑点提示 */}
          {token0 && token1 && token0Amount && token1Amount && (
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
              输出金额基于当前池子价格。<br />
              交易可能因价格变动而失败。
            </div>
          )}
        </div>

        {/* 代币选择器 */}
        <TokenSelector
          isOpen={isToken0SelectorOpen}
          onClose={() => setIsToken0SelectorOpen(false)}
          onSelect={setToken0}
          selectedTokens={token1 ? [token1.address] : []}
        />
        <TokenSelector
          isOpen={isToken1SelectorOpen}
          onClose={() => setIsToken1SelectorOpen(false)}
          onSelect={setToken1}
          selectedTokens={token0 ? [token0.address] : []}
        />
      </div>
    </div>
  )
} 