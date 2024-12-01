export interface Token {
  id: string
  symbol: string
  decimals: number
}

export interface Pair {
  id: string
  token0: Token
  token1: Token
  token0Price: string
  token1Price: string
  createdAtTimestamp: string
}

export interface Position {
  id: string
  pair: Pair
  liquidityTokenBalance: string
  createdAtTimestamp: string
}

export interface PositionsData {
  user: {
    liquidityPositions: Position[]
  }
} 