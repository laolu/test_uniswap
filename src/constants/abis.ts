import UniswapV2RouterABI from './abis/UniswapV2Router02.json';
import ERC20ABI from './abis/ERC20.json';
import UniswapV2FactoryABI from './abis/UniswapV2Factory.json';
import PAIR_ABI from './abis/core/UniswapV2Pair.json';

export const UNISWAP_V2_ROUTER_ABI = UniswapV2RouterABI.abi;
export const ERC20_ABI = ERC20ABI.abi; 
export const UNISWAP_V2_FACTORY_ABI = UniswapV2FactoryABI.abi;
export const UNISWAP_V2_PAIR_ABI = PAIR_ABI;
export const ROUTER_ABI = [
  // addLiquidity
  {
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
      { name: 'amountADesired', type: 'uint256' },
      { name: 'amountBDesired', type: 'uint256' },
      { name: 'amountAMin', type: 'uint256' },
      { name: 'amountBMin', type: 'uint256' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' }
    ],
    name: 'addLiquidity',
    outputs: [
      { name: 'amountA', type: 'uint256' },
      { name: 'amountB', type: 'uint256' },
      { name: 'liquidity', type: 'uint256' }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const