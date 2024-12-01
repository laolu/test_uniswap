'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import TokenSelector from './TokenSelector'
import { Token } from '@/constants/tokens'
import { formatUnits } from 'viem'
import { useContractRead } from 'wagmi'
import { ERC20_ABI } from '@/constants/abis'

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

const PAYMENT_METHODS = [
  { id: 'card', name: '信用卡/借记卡', icon: '💳' },
  { id: 'bank', name: '银行转账', icon: '🏦' },
  { id: 'alipay', name: '支付宝', icon: '📱' },
  { id: 'wechat', name: '微信支付', icon: '💬' },
]

export default function Buy() {
  const { address, isConnected } = useAccount()
  const router = useRouter()
  const [token, setToken] = useState<ExtendedToken | null>(null)
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [isTokenSelectorOpen, setIsTokenSelectorOpen] = useState(false)
  const [error, setError] = useState('')

  const { data: tokenBalance } = useContractRead({
    address: token?.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    enabled: !!token?.address && !!address,
    watch: true,
  })

  const handleSubmit = async () => {
    if (!token || !amount || !paymentMethod) {
      setError('请填写所有必填项')
      return
    }

    try {
      // TODO: 实现购买逻辑
      console.log('购买代币:', {
        token: token.symbol,
        amount,
        paymentMethod,
      })
    } catch (error) {
      console.error('购买失败:', error)
      setError('购买失败，请重试')
    }
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow">
        <h2 className="text-xl font-semibold mb-4">连接钱包</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">请先连接钱包以购买代币</p>
        <ConnectButton />
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg mt-8 mx-auto">

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">购买代币</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            使用法币购买代币
          </p>
        </div>

        {/* 代币选择和数量输入 */}
        <div className="mb-6">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-500 dark:text-gray-400">
                购买数量
              </label>
              {token && tokenBalance && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  当前余额: {formatBalance(formatUnits(tokenBalance as bigint, token.decimals))} {token.symbol}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="w-full bg-transparent text-2xl outline-none"
              />
              <button
                onClick={() => setIsTokenSelectorOpen(true)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {token ? token.symbol : '选择代币'}
              </button>
            </div>
          </div>
        </div>

        {/* 支付方式选择 */}
        <div className="mb-6">
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
            支付方式
          </label>
          <div className="grid grid-cols-2 gap-4">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`flex items-center gap-2 p-4 rounded-xl border transition-colors ${
                  paymentMethod === method.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500'
                }`}
              >
                <span className="text-2xl">{method.icon}</span>
                <span className="text-sm font-medium">{method.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 价格估算 */}
        {token && amount && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                预计支付
              </span>
              <span>
                ¥ {(parseFloat(amount) * 7).toFixed(2)} CNY
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                费用
              </span>
              <span>
                ¥ {(parseFloat(amount) * 0.01).toFixed(2)} CNY
              </span>
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <span className="text-sm text-red-600 dark:text-red-400">
              {error}
            </span>
          </div>
        )}

        {/* 提交按钮 */}
        <button
          onClick={handleSubmit}
          disabled={!token || !amount || !paymentMethod}
          className="w-full py-4 bg-blue-500 dark:bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          购买
        </button>

        {/* 代币选择器 */}
        <TokenSelector
          isOpen={isTokenSelectorOpen}
          onClose={() => setIsTokenSelectorOpen(false)}
          onSelect={setToken}
          selectedTokens={[]}
        />
      </div>
    </div>
  )
} 