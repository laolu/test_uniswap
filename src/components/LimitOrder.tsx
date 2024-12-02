'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { ArrowDown, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import TokenSelector from './TokenSelector'
import { Token, WETH, USDC } from '@/constants/tokens'
import { formatUnits } from 'viem'
import { useContractRead } from 'wagmi'
import { ERC20_ABI } from '@/constants/abis'
import Image from 'next/image'

interface ExtendedToken extends Token {
  balance?: string
}

const formatBalance = (balance: string) => {
  const num = parseFloat(balance)
  if (num > 1000000) {
    return `${(num / 1000000).toFixed(2)}M`
  } else if (num > 1000) {
    return `${(num / 1000).toFixed(2)}K`
  }
  return num.toFixed(4)
}

export default function LimitOrder() {
  const { address, isConnected } = useAccount()
  const router = useRouter()
  const [tokenIn, setTokenIn] = useState<ExtendedToken | null>(WETH)
  const [tokenOut, setTokenOut] = useState<ExtendedToken | null>(USDC)
  const [amountIn, setAmountIn] = useState('')
  const [limitPrice, setLimitPrice] = useState('')
  const [isTokenInSelectorOpen, setIsTokenInSelectorOpen] = useState(false)
  const [isTokenOutSelectorOpen, setIsTokenOutSelectorOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: tokenInBalance } = useContractRead({
    address: tokenIn?.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    enabled: !!tokenIn?.address && !!address,
    watch: true,
  })

  const handleSwapTokens = () => {
    const tempToken = tokenIn
    setTokenIn(tokenOut)
    setTokenOut(tempToken)
    setAmountIn('')
    setLimitPrice('')
  }

  const handleSubmit = async () => {
    if (!tokenIn || !tokenOut || !amountIn || !limitPrice || !address) {
      return
    }

    try {
      setIsSubmitting(true)
      // TODO: 实现限价订单逻辑
      console.log('创建限价订单:', {
        tokenIn: tokenIn.symbol,
        tokenOut: tokenOut.symbol,
        amountIn,
        limitPrice,
      })
    } catch (error) {
      console.error('创建限价订单失败:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const calculatedAmountOut = amountIn && limitPrice 
    ? (parseFloat(amountIn) * parseFloat(limitPrice)).toFixed(6)
    : ''

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow">
        <h2 className="text-xl font-semibold mb-4">连接钱包</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">请先连接钱包以进行交易</p>
        <ConnectButton />
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg mt-8 mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">限价交易</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            设置价格，等待市场达到您的目标价格时自动执行交易
          </p>
        </div>

        {/* 输入代币 */}
        <div className="mb-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-500 dark:text-gray-400">
                支付
              </label>
              {tokenIn && tokenInBalance && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  余额: {formatBalance(formatUnits(tokenInBalance as bigint, tokenIn.decimals))} {tokenIn.symbol}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                placeholder="0.0"
                className="w-full bg-transparent text-2xl outline-none"
              />
              <button
                onClick={() => setIsTokenInSelectorOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {tokenIn && tokenIn.icon && (
                  <div className="w-5 h-5 rounded-full overflow-hidden">
                    <Image
                      src={tokenIn.icon}
                      alt={tokenIn.symbol}
                      width={20}
                      height={20}
                    />
                  </div>
                )}
                <span>{tokenIn ? tokenIn.symbol : '选择代币'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 限价输入 */}
        <div className="mb-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-500 dark:text-gray-400">
                限价
              </label>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                placeholder="0.0"
                className="w-full bg-transparent text-2xl outline-none"
              />
              <span className="text-gray-500">
                {tokenOut ? tokenOut.symbol : ''}/{tokenIn ? tokenIn.symbol : ''}
              </span>
            </div>
          </div>
        </div>

        {/* 交换按钮 */}
        <div className="flex justify-center -my-2 relative z-10">
          <button
            onClick={handleSwapTokens}
            className="bg-gray-100 dark:bg-gray-900 p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowDown className="h-6 w-6" />
          </button>
        </div>

        {/* 输出代币 */}
        <div className="mb-6">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-500 dark:text-gray-400">
                获得（估计）
              </label>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={calculatedAmountOut}
                readOnly
                placeholder="0.0"
                className="w-full bg-transparent text-2xl outline-none"
              />
              <button
                onClick={() => setIsTokenOutSelectorOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {tokenOut && tokenOut.icon && (
                  <div className="w-5 h-5 rounded-full overflow-hidden">
                    <Image
                      src={tokenOut.icon}
                      alt={tokenOut.symbol}
                      width={20}
                      height={20}
                    />
                  </div>
                )}
                <span>{tokenOut ? tokenOut.symbol : '选择代币'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 订单信息 */}
        {tokenIn && tokenOut && amountIn && limitPrice && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                订单类型
              </span>
              <span>限价买入</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                触发价格
              </span>
              <span>
                1 {tokenIn.symbol} = {limitPrice} {tokenOut.symbol}
              </span>
            </div>
          </div>
        )}

        {/* 提交按钮 */}
        <button
          onClick={handleSubmit}
          disabled={!tokenIn || !tokenOut || !amountIn || !limitPrice || isSubmitting}
          className="w-full py-4 bg-blue-500 dark:bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '创建中...' : '创建限价订单'}
        </button>

        {/* 代币选择器 */}
        <TokenSelector
          isOpen={isTokenInSelectorOpen}
          onClose={() => setIsTokenInSelectorOpen(false)}
          onSelect={setTokenIn}
          selectedTokens={tokenOut ? [tokenOut.address] : []}
        />
        <TokenSelector
          isOpen={isTokenOutSelectorOpen}
          onClose={() => setIsTokenOutSelectorOpen(false)}
          onSelect={setTokenOut}
          selectedTokens={tokenIn ? [tokenIn.address] : []}
        />
      </div>
    </div>
  )
} 