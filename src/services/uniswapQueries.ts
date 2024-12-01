import { gql, request } from 'graphql-request'
import { GRAPH_URL } from '@/lib/constants'
import type { Position } from '@/types/uniswap'

const GET_POSITIONS_QUERY = gql`
  query GetPositions($address: String!) {
    user(id: $address) {
      liquidityPositions {
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
          createdAtTimestamp
        }
        liquidityTokenBalance
      }
    }
  }
`

export async function fetchPositions(address: string): Promise<Position[]> {
  try {
    const data = await request(GRAPH_URL, GET_POSITIONS_QUERY, { 
      address: address.toLowerCase() 
    }) as { user: { liquidityPositions: Position[] } | null }
    
    // 如果用户不存在或没有流动性头寸，返回空数组
    if (!data.user) {
      return []
    }
    
    return data.user.liquidityPositions
  } catch (error) {
    console.error('Error fetching positions:', error)
    throw error
  }
} 