import { SupportedChainId } from './chains';

// Token 类型定义
export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId: SupportedChainId;
  icon?: string;
}

export const WETH: Token = {
  address: '0x86268F605DA130ea51E51cbD90215cE4f6e2A4C4',
  symbol: 'WETH',
  name: 'Wrapped Ether',
  decimals: 18,
  chainId: SupportedChainId.SEPOLIA,
  icon: '/tokens/weth.png'
};

export const USDC: Token = {
  address: '0x9Bd1AF68Abbc63195aeEA1260d1F294e7e03E511',
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: 18,
  chainId: SupportedChainId.SEPOLIA,
  icon: '/tokens/usdc.png'
};

export const DAI: Token = {
  address: '0x6607b0CE0Ef51520b50B37FC1B732534CE8d24a4',
  symbol: 'DAI',
  name: 'Dai Stablecoin',
  decimals: 18,
  chainId: SupportedChainId.SEPOLIA,
  icon: '/tokens/dai.png'
};

export const USDT: Token = {
  address: '0x9d6C5b366BF6ea47523b34dc0A98056893f29876',
  symbol: 'USDT',
  name: 'Tether USD',
  decimals: 18,
  chainId: SupportedChainId.SEPOLIA,
  icon: '/tokens/usdt.png'
};

export const COMMON_TOKENS = [WETH, USDC, DAI,USDT]; 