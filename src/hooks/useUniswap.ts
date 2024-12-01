import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'
import { PoolData, SwapsData } from '@/types/uniswap'
import { GRAPH_URL } from '@/lib/constants'

export function usePool<T = PoolData>(poolId: string) {
  return useQuery({
    queryKey: ['pool', poolId],
    queryFn: async () => {
      const query = gql`
        query getPair($pairId: ID!) {
          pair(id: $pairId) {
            id
            token0 {
              id
              symbol
              name
              decimals
            }
            token1 {
              id
              symbol
              name
              decimals
            }
            reserve0
            reserve1
            reserveUSD
            token0Price
            token1Price
          }
        }
      `
      return request<T>(GRAPH_URL, query, { pairId: poolId })
    }
  })
}

export function useSwaps<T = SwapsData>(poolId: string, skip = 0, first = 100) {
  return useQuery({
    queryKey: ['swaps', poolId, skip, first],
    queryFn: async () => {
      const query = gql`
        query getSwaps($pairId: ID!, $skip: Int!, $first: Int!) {
          swaps(
            where: { pair: $pairId }
            skip: $skip
            first: $first
            orderBy: timestamp
            orderDirection: desc
          ) {
            id
            timestamp
            amount0In
            amount1In
            amount0Out
            amount1Out
            amountUSD
            sender
            to
          }
        }
      `
      return request<T>(GRAPH_URL, query, { pairId: poolId, skip, first })
    }
  })
} 