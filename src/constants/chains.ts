import { ChainId } from '@uniswap/sdk';

export enum SupportedChainId {
  MAINNET = ChainId.MAINNET,
  SEPOLIA = 11155111
}

export const CHAIN_IDS = Object.values(SupportedChainId).filter(
  (id): id is number => typeof id === 'number'
); 

export const SEPOLIA_CHAIN_ID = 11155111 as const; // Sepolia 测试网的 Chain ID

export const SUPPORTED_CHAINS = {
  SEPOLIA: SEPOLIA_CHAIN_ID,
} as const; 