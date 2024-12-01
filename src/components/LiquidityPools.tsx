'use client'

import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'
import { formatUnits } from 'viem'
import Link from 'next/link'
import { GRAPH_URL } from '@/lib/constants'

interface Token {
  id: string
  symbol: string
  decimals: number
}

interface Pool {
  id: string
  token0: Token
  token1: Token
  reserve0: string
  reserve1: string
  reserveUSD: string
  volumeUSD: string
  token0Price: string
  token1Price: string
}

interface PoolsData {
  pairs: Pool[]
}

// 辅助函数：安全地格式化数字
function formatReserve(value: string, decimals: number): string {
  try {
    // 移除小数点后的部分，只保留整数部分
    const integerPart = value.split('.')[0]
    return formatUnits(BigInt(integerPart), decimals)
  } catch (error) {
    console.error('Format error:', error)
    return '0'
  }
}

export default function LiquidityPools() {
  const { data, isLoading, error } = useQuery<PoolsData>({
    queryKey: ['pools'],
    queryFn: async () => {
      const query = gql`
        query getPairs {
          pairs(
            first: 100,
            orderBy: reserveUSD,
            orderDirection: desc
          ) {
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
            reserve0
            reserve1
            reserveUSD
            volumeUSD
            token0Price
            token1Price
          }
        }
      `
      const result = await request(GRAPH_URL, query)
      console.log('Pools data:', result)
      return result
    }
  })

  if (isLoading) return <div>加载中...</div>
  if (error) return <div>加载失败: {error.message}</div>

  if (!data?.pairs?.length) {
    return <div>没有找到流动性池</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow">
        <thead>
          <tr className="border-b dark:border-gray-700">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              池子
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              TVL
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              交易量
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              储备量
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              价格
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.pairs.map((pool) => (
            <tr 
              key={pool.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <td className="px-6 py-4">
                <Link 
                  href={`/pool/${pool.id}`}
                  className="text-primary hover:underline"
                >
                  {pool.token0.symbol}/{pool.token1.symbol}
                </Link>
              </td>
              <td className="px-6 py-4">
                ${Number(pool.reserveUSD).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </td>
              <td className="px-6 py-4">
                ${Number(pool.volumeUSD).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </td>
              <td className="px-6 py-4">
                {formatReserve(pool.reserve0, pool.token0.decimals)} {pool.token0.symbol}
                <br />
                {formatReserve(pool.reserve1, pool.token1.decimals)} {pool.token1.symbol}
              </td>
              <td className="px-6 py-4">
                1 {pool.token0.symbol} = {Number(pool.token0Price).toFixed(6)} {pool.token1.symbol}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
} 