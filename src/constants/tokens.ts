import { Token } from '@uniswap/sdk';
import { SupportedChainId } from './chains';

export const WETH = new Token(
  SupportedChainId.SEPOLIA,
  '0x03Ee6A170cE7CDBD3d6D7dB89b7683374f03A78F',
  18,
  'WETH',
  'Wrapped Ether'
);

export const USDC = new Token(
  SupportedChainId.SEPOLIA,
  '0x22013aFa65EDc2f0E2eD49D1EEA19A663aEC860d',
  6,
  'USDC',
  'USD Coin'
);

export const DAI = new Token(
  SupportedChainId.SEPOLIA,
  '0xc95FBeCcE5D0B354122D0258b2eB4Cb15604106C',
  18,
  'DAI',
  'Dai Stablecoin'
);

export const COMMON_TOKENS = [WETH, USDC, DAI]; 