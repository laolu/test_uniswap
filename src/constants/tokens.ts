import { Token } from '@uniswap/sdk';
import { SupportedChainId } from './chains';

export const WETH = new Token(
  SupportedChainId.SEPOLIA,
  '0x86268F605DA130ea51E51cbD90215cE4f6e2A4C4',
  18,
  'WETH',
  'Wrapped Ether'
);

export const USDC = new Token(
  SupportedChainId.SEPOLIA,
  '0x9Bd1AF68Abbc63195aeEA1260d1F294e7e03E511',
  18,
  'USDC',
  'USD Coin'
);

export const DAI = new Token(
  SupportedChainId.SEPOLIA,
  '0x6607b0CE0Ef51520b50B37FC1B732534CE8d24a4',
  18,
  'DAI',
  'My Dai'
);

export const USDT = new Token(
  SupportedChainId.SEPOLIA,
  '0x9d6C5b366BF6ea47523b34dc0A98056893f29876',
  18,
  'USDT',
  'My USDT'
);

export const COMMON_TOKENS = [WETH, USDC, DAI,USDT]; 