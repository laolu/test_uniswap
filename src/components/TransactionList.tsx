'use client'

import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'
import { formatUnits } from 'viem'
import { GRAPH_URL } from '@/lib/constants'
import Link from 'next/link'
import { format } from 'timeago.js'
import * as timeago from 'timeago.js'
import zh_CN from 'timeago.js/lib/lang/zh_CN'

// 注册中文语言包
timeago.register('zh_CN', zh_CN)

interface Token {
  id: string
  symbol: string
  decimals: number
}

interface Pair {
  id: string
  token0: Token
  token1: Token
}

interface Transaction {
  id: string
  timestamp: string
  pair: Pair
  amount0In: string
  amount1In: string
  amount0Out: string
  amount1Out: string
  amountUSD: string
  to: string
}

interface TransactionsData {
  swaps: Transaction[]
}

// 辅助函数：安全地格式化数字
function formatAmount(value: string, decimals: number): string {
  try {
    // 移除小数点后的部分
    const integerPart = value.split('.')[0]
    return formatUnits(BigInt(integerPart || '0'), decimals)
  } catch (error) {
    console.error('Format error:', error)
    return '0'
  }
}

export default function TransactionList() {
  const { data, isLoading } = useQuery<TransactionsData>({
    queryKey: ['transactions'],
    queryFn: async () => {
      const query = gql`
        query getTransactions {
          swaps(
            first: 50
            orderBy: timestamp
            orderDirection: desc
          ) {
            id
            timestamp
            pair {
              id
              token0 {
                id
                symbol
                decimals
              }
              token1 {
                id
                symbol
                decimals
              }
            }
            amount0In
            amount1In
            amount0Out
            amount1Out
            amountUSD
            to
          }
        }
      `
      return request(GRAPH_URL, query)
    },
    refetchInterval: 10000 // 每10秒刷新一次
  })

  if (isLoading) return <div>加载中...</div>

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow">
        <thead>
          <tr className="border-b dark:border-gray-700">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              时间
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              交易对
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              类型
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              价格
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              数量
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              账户
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {data?.swaps.map((tx) => {
            const isToken0Buy = Number(tx.amount0In) === 0
            const token0Amount = isToken0Buy ? tx.amount0Out : tx.amount0In
            const token1Amount = isToken0Buy ? tx.amount1In : tx.amount1Out
            const timestamp = Number(tx.timestamp) * 1000
            
            return (
              <tr 
                key={tx.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm">
                      {format(timestamp, 'zh_CN')}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(timestamp).toLocaleString()}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link 
                    href={`/explore/pools/${tx.pair.id}`}
                    className="text-primary hover:underline"
                  >
                    {tx.pair.token0.symbol}/{tx.pair.token1.symbol}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-lg text-sm ${
                    isToken0Buy 
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' 
                      : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
                  }`}>
                    {isToken0Buy ? '买入' : '卖出'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ${Number(tx.amountUSD).toLocaleString(undefined, { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatAmount(token0Amount, tx.pair.token0.decimals)} {tx.pair.token0.symbol}
                  <br />
                  {formatAmount(token1Amount, tx.pair.token1.decimals)} {tx.pair.token1.symbol}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link 
                    href={`/explore/accounts/${tx.to}`}
                    className="text-primary hover:underline"
                  >
                    {tx.to.slice(0, 6)}...{tx.to.slice(-4)}
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
} 