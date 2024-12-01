import React from 'react'
import { usePool, useSwaps } from '../hooks/useUniswap'
import { formatUnits } from 'viem'
import { PoolData, SwapsData, Swap } from '@/types/uniswap'

interface UniswapInfoProps {
  poolId: string
}

export const UniswapInfo: React.FC<UniswapInfoProps> = ({ poolId }) => {
  const { data: poolData, isLoading: poolLoading } = usePool<PoolData>(poolId)
  const { data: swapsData, isLoading: swapsLoading } = useSwaps<SwapsData>(poolId)

  if (poolLoading || swapsLoading) {
    return <div>加载中...</div>
  }

  const pair = poolData?.pair
  const swaps = swapsData?.swaps || []

  return (
    <div className="p-4">
      {/* 池子信息 */}
      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">池子信息</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold">代币对</h3>
            <p>{pair?.token0.symbol} / {pair?.token1.symbol}</p>
          </div>
          <div>
            <h3 className="font-semibold">流动性 (USD)</h3>
            <p>${Number(pair?.reserveUSD).toFixed(2)}</p>
          </div>
          <div>
            <h3 className="font-semibold">储备量</h3>
            <p>
              {formatUnits(BigInt(pair?.reserve0 || '0'), pair?.token0.decimals)} {pair?.token0.symbol}<br />
              {formatUnits(BigInt(pair?.reserve1 || '0'), pair?.token1.decimals)} {pair?.token1.symbol}
            </p>
          </div>
          <div>
            <h3 className="font-semibold">当前价格</h3>
            <p>1 {pair?.token0.symbol} = {Number(pair?.token0Price).toFixed(6)} {pair?.token1.symbol}</p>
          </div>
        </div>
      </div>

      {/* 最近交易 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">最近交易</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left">时间</th>
                <th className="px-4 py-2 text-left">类型</th>
                <th className="px-4 py-2 text-left">数量</th>
                <th className="px-4 py-2 text-left">金额 (USD)</th>
              </tr>
            </thead>
            <tbody>
              {swaps.map((swap: Swap) => {
                const isToken0Buy = Number(swap.amount0In) === 0
                const token0Amount = isToken0Buy ? swap.amount0Out : swap.amount0In
                const token1Amount = isToken0Buy ? swap.amount1In : swap.amount1Out
                
                return (
                  <tr key={swap.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">
                      {new Date(Number(swap.timestamp) * 1000).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      {isToken0Buy ? '买入' : '卖出'} {pair?.token0.symbol}
                    </td>
                    <td className="px-4 py-2">
                      {formatUnits(BigInt(token0Amount), pair?.token0.decimals)} {pair?.token0.symbol}
                      <br />
                      {formatUnits(BigInt(token1Amount), pair?.token1.decimals)} {pair?.token1.symbol}
                    </td>
                    <td className="px-4 py-2">
                      ${Number(swap.amountUSD).toFixed(2)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 