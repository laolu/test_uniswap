'use client'

import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'
import { GRAPH_URL } from '@/lib/constants'
import Link from 'next/link'
import { formatUnits } from 'viem'
import { Plus } from 'lucide-react'

interface Token {
  id: string
  symbol: string
  decimals: number
}

interface Position {
  id: string
  pair: {
    id: string
    token0: Token
    token1: Token
    token0Price: string
    token1Price: string
  }
  liquidityTokenBalance: string
  createdAtTimestamp: string
}

interface PositionsData {
  liquidityPositions: Position[]
}

export default function PositionList() {
  const { address, isConnected } = useAccount()

  const { data, isLoading } = useQuery<PositionsData>({
    queryKey: ['positions', address],
    queryFn: async () => {
      const query = gql`
        query getPositions($user: String!) {
          liquidityPositions(
            where: { user: $user, liquidityTokenBalance_gt: "0" }
            orderBy: createdAtTimestamp
            orderDirection: desc
          ) {
            id
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
              token0Price
              token1Price
            }
            liquidityTokenBalance
            createdAtTimestamp
          }
        }
      `
      return request(GRAPH_URL, query, { user: address?.toLowerCase() })
    },
    enabled: !!address
  })

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow">
        <h2 className="text-xl font-semibold mb-4">连接钱包</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">请先连接钱包以查看您的头寸</p>
        <ConnectButton />
      </div>
    )
  }

  if (isLoading) {
    return <div>加载中...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">我的头寸</h1>
        <Link
          href="/pools/add"
          className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-blue-500 dark:bg-blue-600 px-8 py-4 transition-all hover:bg-blue-600 dark:hover:bg-blue-700 active:scale-[0.98] shadow-lg hover:shadow-blue-500/50 dark:hover:shadow-blue-600/50"
        >
          <div className="relative flex items-center gap-2">
            <Plus className="h-5 w-5 text-white" />
            <span className="text-base font-semibold text-white">
              添加流动性
            </span>
          </div>
        </Link>
      </div>

      <div className="space-y-4">
        {!data?.liquidityPositions.length ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow">
            <h2 className="text-xl font-semibold mb-4">暂无头寸</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              您还没有添加任何流动性
            </p>
          </div>
        ) : (
          data.liquidityPositions.map((position) => (
            <div
              key={position.id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    {position.pair.token0.symbol}/{position.pair.token1.symbol}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    创建于 {new Date(Number(position.createdAtTimestamp) * 1000).toLocaleString()}
                  </p>
                </div>
                <Link
                  href={`/pools/${position.pair.id}`}
                  className="text-primary hover:underline"
                >
                  查看详情
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    流动性份额
                  </div>
                  <div className="font-medium">
                    {formatUnits(BigInt(position.liquidityTokenBalance), 18)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    当前价格
                  </div>
                  <div className="font-medium">
                    1 {position.pair.token0.symbol} = {Number(position.pair.token0Price).toFixed(6)}{' '}
                    {position.pair.token1.symbol}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
} 