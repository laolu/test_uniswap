import { Token, WETH, Fetcher, Route, Trade, TokenAmount, TradeType, Percent, ChainId } from '@uniswap/sdk';
import { UNISWAP_V2_ROUTER_ABI, ERC20_ABI, UNISWAP_V2_FACTORY_ABI } from '@/constants/abis';
import { getContract, readContract, writeContract } from '@wagmi/core';
import { parseUnits } from 'viem';
import { SEPOLIA_CHAIN_ID } from '@/constants/chains';
import { ethers } from 'ethers';

// Sepolia 测试网上的合约地址
export const UNISWAP_V2_ROUTER = '0x004D1a31a9C4c2123cC2598cAe13425d408853aB';
export const UNISWAP_V2_FACTORY = '0xa5a9E73eA7a75F54613a465184dE1969b227651C';

// 在文件顶部添加 Sepolia ChainId 的声明
declare module '@uniswap/sdk' {
  export enum ChainId {
    MAINNET = 1,
    ROPSTEN = 3,
    RINKEBY = 4,
    GÖRLI = 5,
    KOVAN = 42,
    SEPOLIA = 11155111
  }
}

// 修改 TOKENS 的声明，使用新的 ChainId.SEPOLIA
export const TOKENS = {
  WETH: new Token(
    ChainId.SEPOLIA,  // 使用枚举值
    '0x03Ee6A170cE7CDBD3d6D7dB89b7683374f03A78F',
    18,
    'WETH',
    'Wrapped Ether'
  ),
  USDC: new Token(
    ChainId.SEPOLIA,  // 使用枚举值
    '0x22013aFa65EDc2f0E2eD49D1EEA19A663aEC860d',
    18,
    'USDC',
    'USD Coin'
  ),
  DAI: new Token(
    ChainId.SEPOLIA,  // 使用枚举值
    '0xc95FBeCcE5D0B354122D0258b2eB4Cb15604106C',
    18,
    'DAI',
    'Dai Stablecoin'
  ),
};

// 创建交易对
export async function createPair(tokenA: Token, tokenB: Token) {
  try {
    // 确保代币按地址排序
    const [token0, token1] = tokenA.address < tokenB.address ? [tokenA, tokenB] : [tokenB, tokenA];
    
    // 先检查交易对是否已存在
    const existingPair = await readContract({
      address: UNISWAP_V2_FACTORY as `0x${string}`,
      abi: UNISWAP_V2_FACTORY_ABI,
      functionName: 'getPair',
      args: [token0.address, token1.address],
    });

    // 如果交易对已存在且不是零地址，则直接返回
    if (existingPair && existingPair !== '0x0000000000000000000000000000000000000000') {
      console.log('交易对已存在:', existingPair);
      return existingPair;
    }

    console.log('创建新的交易对...');
    const createPairTx = await writeContract({
      address: UNISWAP_V2_FACTORY as `0x${string}`,
      abi: UNISWAP_V2_FACTORY_ABI,
      functionName: 'createPair',
      args: [token0.address, token1.address],
    });

    return createPairTx;
  } catch (error) {
    console.error('创建交易对失败:', error);
    throw error;
  }
}

// 添加流动性
export async function addInitialLiquidity(
  tokenA: Token,
  tokenB: Token,
  amountA: string,
  amountB: string,
  account: string,
  slippageTolerance: number = 0.5
) {
  try {
    // 检查代币余额
    const balanceA = await readContract({
      address: tokenA.address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [account],
    });

    const balanceB = await readContract({
      address: tokenB.address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [account],
    });

    const amountAWei = parseUnits(amountA, tokenA.decimals);
    const amountBWei = parseUnits(amountB, tokenB.decimals);

    console.log('添加流动性参数:', {
      tokenA: {
        address: tokenA.address,
        decimals: tokenA.decimals,
        balance: balanceA.toString(),
        amount: amountAWei.toString()
      },
      tokenB: {
        address: tokenB.address,
        decimals: tokenB.decimals,
        balance: balanceB.toString(),
        amount: amountBWei.toString()
      }
    });

    // 检查余额是否足够
    if (balanceA < amountAWei) {
      throw new Error(`${tokenA.symbol} 余额不足`);
    }
    if (balanceB < amountBWei) {
      throw new Error(`${tokenB.symbol} 余额不足`);
    }

    // 检查现有授权额度
    const allowanceA = await readContract({
      address: tokenA.address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [account, UNISWAP_V2_ROUTER],
    });

    const allowanceB = await readContract({
      address: tokenB.address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [account, UNISWAP_V2_ROUTER],
    });

    console.log('授权情况:', {
      tokenA: {
        allowance: allowanceA.toString(),
        needed: amountAWei.toString()
      },
      tokenB: {
        allowance: allowanceB.toString(),
        needed: amountBWei.toString()
      }
    });

    // 如果授权额度不足，则进行授权
    if (allowanceA < amountAWei) {
      console.log(`正在授权 ${tokenA.symbol}...`);
      const approveATx = await writeContract({
        address: tokenA.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [UNISWAP_V2_ROUTER, amountAWei],
      });
      console.log(`${tokenA.symbol} 授权成功:`, approveATx);
    }

    if (allowanceB < amountBWei) {
      console.log(`正在授权 ${tokenB.symbol}...`);
      const approveBTx = await writeContract({
        address: tokenB.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [UNISWAP_V2_ROUTER, amountBWei],
      });
      console.log(`${tokenB.symbol} 授权成功:`, approveBTx);
    }

    // 计算最小接受数量（考虑滑点）
    const amountAMin = BigInt(amountAWei) * BigInt(1000 - slippageTolerance * 10) / BigInt(1000);
    const amountBMin = BigInt(amountBWei) * BigInt(1000 - slippageTolerance * 10) / BigInt(1000);

    // 添加流动性
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20分钟后过期
    console.log('添加流动性参数:', {
      tokenA: tokenA.address,
      tokenB: tokenB.address,
      amountADesired: amountAWei.toString(),
      amountBDesired: amountBWei.toString(),
      amountAMin: amountAMin.toString(),
      amountBMin: amountBMin.toString(),
      to: account,
      deadline
    });

    const addLiquidityTx = await writeContract({
      address: UNISWAP_V2_ROUTER as `0x${string}`,
      abi: UNISWAP_V2_ROUTER_ABI,
      functionName: 'addLiquidity',
      args: [
        tokenA.address,
        tokenB.address,
        amountAWei,
        amountBWei,
        amountAMin,
        amountBMin,
        account,
        BigInt(deadline),
      ],
    });

    return addLiquidityTx;
  } catch (error) {
    console.error('添加流动性失败:', error);
    // 提供更详细的错误信息
    if (error.message.includes('insufficient')) {
      throw new Error('代币余额不足');
    } else if (error.message.includes('EXPIRED')) {
      throw new Error('交易超时');
    } else {
      throw error;
    }
  }
}

// 创建 ethers provider
function createProvider(publicClient: any) {
  const { chain, transport } = publicClient;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  
  return new ethers.providers.JsonRpcProvider(
    transport.transports[0].value.url,
    network
  );
}

export async function getPrice(
  tokenIn: Token,
  tokenOut: Token,
  amountIn: string,
  publicClient: any
) {
  try {
    console.log('Getting price for:', {
      tokenIn: tokenIn.address,
      tokenOut: tokenOut.address,
      amountIn,
      chainId: tokenIn.chainId
    });

    // 从 Factory 获取交易对地址
    const pairAddress = await readContract({
      address: UNISWAP_V2_FACTORY as `0x${string}`,
      abi: FACTORY_ABI,
      functionName: 'getPair',
      args: [tokenIn.address, tokenOut.address],
    });

    console.log('Pair address:', pairAddress);

    if (!pairAddress || pairAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error('交易对不存在');
    }

    const provider = createProvider(publicClient);
    const pair = await Fetcher.fetchPairData(tokenIn, tokenOut, provider);
    console.log('Pair fetched:', pair);

    const route = new Route([pair], tokenIn);
    const amountInWei = parseUnits(amountIn, tokenIn.decimals).toString();
    
    const trade = new Trade(
      route,
      new TokenAmount(tokenIn, amountInWei),
      TradeType.EXACT_INPUT
    );

    return {
      executionPrice: trade.executionPrice.toSignificant(6),
      nextMidPrice: trade.nextMidPrice.toSignificant(6),
      priceImpact: trade.priceImpact.toSignificant(2),
      amountOut: trade.outputAmount.toSignificant(6),
      minimumAmountOut: trade.minimumAmountOut(new Percent('50', '10000')).toSignificant(6),
      pairAddress,
    };
  } catch (error) {
    console.error('获取价格失败:', error);
    console.error('错误详情:', {
      tokenIn: {
        address: tokenIn.address,
        decimals: tokenIn.decimals,
        symbol: tokenIn.symbol,
        chainId: tokenIn.chainId
      },
      tokenOut: {
        address: tokenOut.address,
        decimals: tokenOut.decimals,
        symbol: tokenOut.symbol,
        chainId: tokenOut.chainId
      },
      amountIn
    });
    return null;
  }
}

export async function executeSwap(
  tokenIn: Token,
  tokenOut: Token,
  amountIn: string,
  slippageTolerance: number = 0.5,
  walletClient: any,
  account: string
) {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const pair = await Fetcher.fetchPairData(tokenIn, tokenOut, provider);
    const route = new Route([pair], tokenIn);
    const amountInWei = parseUnits(amountIn, tokenIn.decimals).toString();
    
    const trade = new Trade(
      route,
      new TokenAmount(tokenIn, amountInWei),
      TradeType.EXACT_INPUT
    );

    // 计算最小获得数量（考虑滑点）
    const slippagePercent = new Percent(Math.floor(slippageTolerance * 100).toString(), '10000');
    const minAmountOut = trade.minimumAmountOut(slippagePercent).raw.toString();

    // 批准代币使用
    const approvalHash = await writeContract({
      address: tokenIn.address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [UNISWAP_V2_ROUTER, BigInt(amountInWei)],
    });

    // 执行交换
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20分钟后过期
    const swapHash = await writeContract({
      address: UNISWAP_V2_ROUTER as `0x${string}`,
      abi: UNISWAP_V2_ROUTER_ABI,
      functionName: 'swapExactTokensForTokens',
      args: [
        BigInt(amountInWei),
        BigInt(minAmountOut),
        [tokenIn.address, tokenOut.address],
        account,
        BigInt(deadline),
      ],
    });

    return swapHash;
  } catch (error) {
    console.error('交易执行失败:', error);
    throw error;
  }
} 