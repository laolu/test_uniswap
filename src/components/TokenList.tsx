'use client'

import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'
import { formatUnits } from 'viem'
import { GRAPH_URL } from '@/lib/constants'
import Link from 'next/link'

interface Token {
  id: string
  symbol: string
  name: string
  decimals: number
  totalSupply: string
  tradeVolume: string
  tradeVolumeUSD: string
  untrackedVolumeUSD: string
  txCount: string
  totalLiquidity: string
  derivedETH: string
}

interface TokensData {
  tokens: Token[]
  bundle: {
    ethPrice: string
  }
}

export default function TokenList() {
  const { data, isLoading } = useQuery<TokensData>({
    queryKey: ['tokens'],
    queryFn: async () => {
      const query = gql`
        query getTokens {
          tokens(
            first: 100
            orderBy: tradeVolumeUSD
            orderDirection: desc
            where: { totalLiquidity_gt: "0" }
          ) {
            id
            symbol
            name
            decimals
            totalSupply
            tradeVolume
            tradeVolumeUSD
            untrackedVolumeUSD
            txCount
            totalLiquidity
            derivedETH
          }
          bundle(id: "1") {
            ethPrice
          }
        }
      `
      return request(GRAPH_URL, query)
    },
    refetchInterval: 30000 // 每30秒刷新一次
  })

  if (isLoading) return <div>加载中...</div>

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow">
        <thead>
          <tr className="border-b dark:border-gray-700">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              代币
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              价格
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              价格变化
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              交易量 (24h)
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              流动性
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {data?.tokens.map((token) => {
            const priceUSD = Number(token.derivedETH) * Number(data.bundle.ethPrice)
            const volumeUSD = Number(token.tradeVolumeUSD)
            const liquidityUSD = Number(token.totalLiquidity) * priceUSD
            
            return (
              <tr 
                key={token.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="ml-4">
                      <div className="text-sm font-medium">
                        <Link 
                          href={`/explore/tokens/${token.id}`}
                          className="text-primary hover:underline"
                        >
                          {token.symbol}
                        </Link>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {token.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ${priceUSD.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6
                  })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-green-600 dark:text-green-400">
                    +0.00%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ${volumeUSD.toLocaleString(undefined, {
                    maximumFractionDigits: 0
                  })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ${liquidityUSD.toLocaleString(undefined, {
                    maximumFractionDigits: 0
                  })}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
} 