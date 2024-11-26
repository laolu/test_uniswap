import { Token } from '@uniswap/sdk';
import { SupportedChainId } from './chains';

export const WETH = new Token(
  SupportedChainId.SEPOLIA,
  '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
  18,
  'WETH',
  'Wrapped Ether'
);

export const USDC = new Token(
  SupportedChainId.SEPOLIA,
  '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  6,
  'USDC',
  'USD Coin'
);

export const DAI = new Token(
  SupportedChainId.SEPOLIA,
  '0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6',
  18,
  'DAI',
  'Dai Stablecoin'
);

export const COMMON_TOKENS = [WETH, USDC, DAI]; 