'use client'

import { useState, useEffect } from 'react'
import { useAccount,useContractRead } from 'wagmi'
import { ArrowUpDown, ArrowLeft } from 'lucide-react'
import TokenSelector from './TokenSelector'
import { useRouter } from 'next/navigation'
import { addInitialLiquidity } from '@/services/uniswap'
import { Token, DAI, USDT } from '@/constants/tokens'
import { ERC20_ABI } from '@/constants/abis'
import { formatUnits, parseUnits } from 'viem'
import { readContract } from '@wagmi/core'
import Image from 'next/image'
import { UNISWAP_V2_FACTORY, UNISWAP_V2_FACTORY_ABI, UNISWAP_V2_PAIR_ABI, UNISWAP_V2_ROUTER, UNISWAP_V2_ROUTER_ABI } from '@/constants/contracts'

interface ExtendedToken extends Token {
  balance?: string
}

interface PoolInfo {
  reserve0: bigint
  reserve1: bigint
  totalSupply: bigint
  myShare: bigint
  poolShare: string
  token0Price: string
  token1Price: string
}

// 直接定义需要的 ABI
const PAIR_ABI = [
  {
    "inputs": [],
    "name": "getReserves",
    "outputs": [
      {
        "internalType": "uint112",
        "name": "_reserve0",
        "type": "uint112"
      },
      {
        "internalType": "uint112",
        "name": "_reserve1",
        "type": "uint112"
      },
      {
        "internalType": "uint32",
        "name": "_blockTimestampLast",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export default function AddLiquidity() {
  const { address, isConnected } = useAccount()
  const [token0Amount, setToken0Amount] = useState('')
  const [token1Amount, setToken1Amount] = useState('')
  const [token0, setToken0] = useState<ExtendedToken>(USDT)
  const [token1, setToken1] = useState<ExtendedToken>(DAI)
  const [isToken0SelectorOpen, setIsToken0SelectorOpen] = useState(false)
  const [isToken1SelectorOpen, setIsToken1SelectorOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null)

  const { data: token0Balance } = useContractRead({
    address: token0?.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    enabled: Boolean(token0?.address && address),
    watch: true,
  })

  const { data: token1Balance } = useContractRead({
    address: token1?.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    enabled: Boolean(token1?.address && address),
    watch: true,
  })

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

    // 检查余额
    const token0BalanceNum = token0Balance ? Number(formatUnits(token0Balance as bigint, token0.decimals)) : 0
    const token1BalanceNum = token1Balance ? Number(formatUnits(token1Balance as bigint, token1.decimals)) : 0
    const token0AmountNum = parseFloat(token0Amount)
    const token1AmountNum = parseFloat(token1Amount)

    if (token0AmountNum > token0BalanceNum) {
      console.error(`${token0.symbol} 余额不足`)
      return
    }

    if (token1AmountNum > token1BalanceNum) {
      console.error(`${token1.symbol} 余额不足`)
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

  // 获取池子信息
  useEffect(() => {
    async function fetchPoolInfo() {
      // 如果没有选择代币，直接返回默认值
      if (!token0 || !token1) {
        setPoolInfo({
          reserve0: BigInt(0),
          reserve1: BigInt(0),
          totalSupply: BigInt(0),
          myShare: BigInt(0),
          poolShare: '0.00',
          token0Price: '0.00',
          token1Price: '0.00',
        })
        return
      }

      try {
        // 获取交易对地址
        const pairAddress = await readContract({
          address: UNISWAP_V2_FACTORY as `0x${string}`,
          abi: UNISWAP_V2_FACTORY_ABI,
          functionName: 'getPair',
          args: [token0.address, token1.address],
        }) as `0x${string}`

        let poolShare = '0.00'
        let totalSupply = BigInt(0)
        let myShare = BigInt(0)
        let reserve0 = BigInt(0)
        let reserve1 = BigInt(0)

        // 如果交易对存在，获取储备量和价格信息
        if (pairAddress !== '0x0000000000000000000000000000000000000000') {
          const reserves = await readContract({
            address: pairAddress,
            abi: PAIR_ABI,
            functionName: 'getReserves',
          }) as [bigint, bigint, number]

          reserve0 = reserves[0]
          reserve1 = reserves[1]

          // 只有在输入金额时才计算份额
          if (token0Amount && token1Amount && address) {
            // 获取总供应量
            totalSupply = await readContract({
              address: pairAddress,
              abi: PAIR_ABI,
              functionName: 'totalSupply',
            }) as bigint

            // 获取用户LP代币余额
            myShare = await readContract({
              address: pairAddress,
              abi: PAIR_ABI,
              functionName: 'balanceOf',
              args: [address],
            }) as bigint

            // 计算份额
            if (totalSupply === BigInt(0)) {
              poolShare = '100'
            } else {
              const amount0Wei = parseUnits(token0Amount, token0.decimals)
              const amount1Wei = parseUnits(token1Amount, token1.decimals)
              const liquidity = Math.min(
                (Number(amount0Wei) * Number(totalSupply)) / Number(reserve0),
                (Number(amount1Wei) * Number(totalSupply)) / Number(reserve1)
              )
              poolShare = ((liquidity / (Number(totalSupply) + liquidity)) * 100).toFixed(2)
            }
          }
        } else if (token0Amount && token1Amount) {
          // 如果池子不存在且用户输入了金额，则为首个流动性提供者
          poolShare = '100'
        }

        setPoolInfo({
          reserve0,
          reserve1,
          totalSupply,
          myShare,
          poolShare,
          token0Price: reserve0 > 0 ? formatUnits(reserve1 * BigInt(10 ** token0.decimals) / reserve0, token1.decimals) : '0.00',
          token1Price: reserve1 > 0 ? formatUnits(reserve0 * BigInt(10 ** token1.decimals) / reserve1, token0.decimals) : '0.00',
        })
      } catch (error) {
        console.error('获取池子信息失败:', error)
        setPoolInfo(null)
      }
    }

    fetchPoolInfo()
  }, [token0, token1, token0Amount, token1Amount, address])

  return (
    <div className="w-full max-w-4xl mx-auto">
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

        {/* 第一代币输入 */}
        <div className="mb-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <div className="mb-2">
              <label className="text-sm text-gray-500 dark:text-gray-400">
                输入
              </label>
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
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {token0 && token0.icon && (
                  <div className="w-5 h-5 rounded-full overflow-hidden">
                    <Image
                      src={token0.icon}
                      alt={token0.symbol}
                      width={20}
                      height={20}
                    />
                  </div>
                )}
                <span>{token0 ? token0.symbol : '选择代币'}</span>
              </button>
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                余额: {token0Balance ? Number(formatUnits(token0Balance as bigint, token0?.decimals || 18)).toFixed(6) : '0'}
              </span>
            </div>
          </div>
        </div>

        {/* 交换按钮 */}
        <div className="flex justify-center h-0">
          <div className="relative -top-3">
            <button
              onClick={handleSwapTokens}
              disabled={!token0 || !token1}
              className={`
                flex items-center justify-center
                w-10 h-10
                bg-white dark:bg-gray-800 
                border border-gray-200 dark:border-gray-700
                rounded-xl
                shadow-sm
                transition-all
                ${
                  token0 && token1 
                    ? 'hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600' 
                    : 'opacity-50 cursor-not-allowed'
                }
              `}
            >
              <ArrowUpDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* 第二个代币输入 */}
        <div className="mt-8 mb-6">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <div className="mb-2">
              <label className="text-sm text-gray-500 dark:text-gray-400">
                输入
              </label>
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
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {token1 && token1.icon && (
                  <div className="w-5 h-5 rounded-full overflow-hidden">
                    <Image
                      src={token1.icon}
                      alt={token1.symbol}
                      width={20}
                      height={20}
                    />
                  </div>
                )}
                <span>{token1 ? token1.symbol : '选择代币'}</span>
              </button>
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                余额: {token1Balance ? Number(formatUnits(token1Balance as bigint, token1?.decimals || 18)).toFixed(6) : '0'}
              </span>
            </div>
          </div>
        </div>

        {/* 价格和池子份额信息 */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            价格和池子份额
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {token0?.symbol} 价格
                </span>
                <span className="text-sm font-medium">
                  1 {token0?.symbol} = {poolInfo?.token0Price || '0.00'} {token1?.symbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {token1?.symbol} 价格
                </span>
                <span className="text-sm font-medium">
                  1 {token1?.symbol} = {poolInfo?.token1Price || '0.00'} {token0?.symbol}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  份额
                </span>
                <span className="text-lg font-medium text-pink-500 dark:text-pink-400">
                  {poolInfo?.poolShare || '0.00'}%
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {!poolInfo ? '请输入添加的代币数量' :
                  poolInfo.poolShare === '100' 
                    ? '您将是第一个流动性提供者'
                    : '您的份额占池子总流动性的百分比'
                }
              </p>
            </div>
          </div>
        </div>

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
  )
} 