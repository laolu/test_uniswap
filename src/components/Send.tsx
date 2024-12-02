'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import TokenSelector from './TokenSelector'
import { Token, WETH } from '@/constants/tokens'
import { formatUnits, parseUnits } from 'viem'
import { useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi'
import { ERC20_ABI } from '@/constants/abis'
import { isAddress } from 'viem'
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

export default function Send() {
  const { address, isConnected } = useAccount()
  const router = useRouter()
  const [token, setToken] = useState<ExtendedToken | null>(WETH)
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')
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

  const { config } = usePrepareContractWrite({
    address: token?.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: recipient && amount ? [
      recipient as `0x${string}`,
      parseUnits(amount, token?.decimals || 18)
    ] : undefined,
    enabled: !!token?.address && !!recipient && !!amount && isAddress(recipient),
  })

  const { write: sendTokens, isLoading } = useContractWrite(config)

  const validateForm = () => {
    if (!recipient) {
      setError('请输入接收地址')
      return false
    }
    if (!isAddress(recipient)) {
      setError('无效的接收地址')
      return false
    }
    if (!amount) {
      setError('请输入发送数量')
      return false
    }
    if (!token) {
      setError('请选择代币')
      return false
    }
    if (tokenBalance && parseUnits(amount, token.decimals) > tokenBalance) {
      setError('余额不足')
      return false
    }
    setError('')
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    try {
      sendTokens?.()
    } catch (error) {
      console.error('发送代币失败:', error)
      setError('发送失败，请重试')
    }
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow">
        <h2 className="text-xl font-semibold mb-4">连接钱包</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">请先连接钱包以发送代币</p>
        <ConnectButton />
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg mt-8 mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">发送代币</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            将代币发送到其他地址
          </p>
        </div>

        {/* 接收地址输入 */}
        <div className="mb-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-500 dark:text-gray-400">
                接收地址
              </label>
            </div>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full bg-transparent text-lg outline-none"
            />
          </div>
        </div>

        {/* 代币选择和数量输入 */}
        <div className="mb-6">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-500 dark:text-gray-400">
                发送数量
              </label>
              {token && tokenBalance && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  余额: {formatBalance(formatUnits(tokenBalance as bigint, token.decimals))} {token.symbol}
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
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {token && token.icon && (
                  <div className="w-5 h-5 rounded-full overflow-hidden">
                    <Image
                      src={token.icon}
                      alt={token.symbol}
                      width={20}
                      height={20}
                    />
                  </div>
                )}
                <span>{token ? token.symbol : '选择代币'}</span>
              </button>
            </div>
          </div>
        </div>

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
          disabled={!token || !amount || !recipient || isLoading}
          className="w-full py-4 bg-blue-500 dark:bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '发送中...' : '发送代币'}
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