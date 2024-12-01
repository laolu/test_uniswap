export interface Token {
  id: string
  symbol: string
  name: string
  decimals: number
}

export interface Pair {
  id: string
  token0: Token
  token1: Token
  reserve0: string
  reserve1: string
  reserveUSD: string
  token0Price: string
  token1Price: string
}

export interface Swap {
  id: string
  timestamp: string
  amount0In: string
  amount1In: string
  amount0Out: string
  amount1Out: string
  amountUSD: string
  sender: string
  to: string
}

export interface PoolData {
  pair: Pair
}

export interface SwapsData {
  swaps: Swap[]
} 