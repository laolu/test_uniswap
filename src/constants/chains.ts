import { ChainId } from '@uniswap/sdk';

export enum SupportedChainId {
  MAINNET = ChainId.MAINNET,
  SEPOLIA = 11155111
}

export const CHAIN_IDS = Object.values(SupportedChainId).filter(
  (id): id is number => typeof id === 'number'
); 