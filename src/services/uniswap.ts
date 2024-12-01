import { UNISWAP_V2_ROUTER_ABI, ERC20_ABI, UNISWAP_V2_FACTORY_ABI,UNISWAP_V2_PAIR_ABI  } from '@/constants/abis';
import { getContract, readContract, writeContract, waitForTransaction } from '@wagmi/core';
import { parseUnits, formatUnits, maxUint256 } from 'viem';
import { SupportedChainId } from '@/constants/chains';
import {Token} from '@/constants/tokens';
import { fetchPositions } from './uniswapQueries'
import type { Position } from '@/types/uniswap'

// Sepolia 测试网上的合约地址
export const UNISWAP_V2_ROUTER = '0x3361623A4E323e0d3f170b8f39124A5CAccdC725';
export const UNISWAP_V2_FACTORY = '0x4603870b4e0825956842a823cDdDa35426b9Ca01';

// 创建交易对
export async function createPair(tokenA: Token, tokenB: Token) {
  try {
    // 确保代币按地址排序
    const [token0, token1] = tokenA.address.toLowerCase() < tokenB.address.toLowerCase() 
      ? [tokenA, tokenB] 
      : [tokenB, tokenA];
    
    // 先检查交易对是否已存在
    const existingPair = await readContract({
      address: UNISWAP_V2_FACTORY as `0x${string}`,
      abi: UNISWAP_V2_FACTORY_ABI,
      functionName: 'getPair',
      args: [token0.address, token1.address],
    });

    // 如果交易对存在且不是零地址，则直接返回
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

    const receipt = await waitForTransaction({
      hash: createPairTx as `0x${string}`,
      confirmations: 1,
    });

    return receipt.transactionHash;
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
    // 1. 检查交易对是否存在
    const pairAddress = await readContract({
      address: UNISWAP_V2_FACTORY as `0x${string}`,
      abi: UNISWAP_V2_FACTORY_ABI,
      functionName: 'getPair',
      args: [tokenA.address, tokenB.address],
    });
    
    console.log('现有交易对地址:', pairAddress);

    const amountAWei = parseUnits(amountA, tokenA.decimals);
    const amountBWei = parseUnits(amountB, tokenB.decimals);

    // 2. 检查代币余额
    // 检查 tokenA 余额
    const balanceA: bigint = await readContract({
      address: tokenA.address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [account],
    });

    console.log(`${tokenA.symbol} 余额:`, formatUnits(balanceA, tokenA.decimals));

    if (balanceA < amountAWei) {
      throw new Error(`${tokenA.symbol}余额不足: 需要 ${formatUnits(amountAWei, tokenA.decimals)}, 实际 ${formatUnits(balanceA, tokenA.decimals)}`);
    }

    // 检查 tokenB 余额
    const balanceB = await readContract({
      address: tokenB.address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [account],
    });

    console.log(`${tokenB.symbol} 余额:`, formatUnits(balanceB, tokenB.decimals));

    if (balanceB < amountBWei) {
      throw new Error(`${tokenB.symbol}余额不足: 需要 ${formatUnits(amountBWei, tokenB.decimals)}, 实际 ${formatUnits(balanceB, tokenB.decimals)}`);
    }

    // 3. 检查并处理授权
    // 检查 tokenA 的授权
    const allowanceA: bigint = await readContract({
      address: tokenA.address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [account, UNISWAP_V2_ROUTER],
    });

    console.log(`${tokenA.symbol} 当前授权额度:`, formatUnits(allowanceA, tokenA.decimals));

    if (allowanceA < amountAWei) {
      console.log(`正在授权 ${tokenA.symbol}...`);
      const approveTxA = await writeContract({
        address: tokenA.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [UNISWAP_V2_ROUTER, maxUint256],
      });
      console.log(`${tokenA.symbol} 授权交易已发送，交易哈希:`, approveTxA);
      
      // 等待授权交易被确认
      const receipt = await waitForTransaction({
        hash: approveTxA,
        confirmations: 1,    // 等待 1 个确认
        timeout: 60_000,     // 60 秒超时
      });
      
      if (receipt.status === 'success') {
        console.log(`${tokenA.symbol} 授权交易已确认`);
      } else {
        throw new Error(`${tokenA.symbol} 授权交易失败`);
      }
    }

    // 检查 tokenB 的授权
    const allowanceB = await readContract({
      address: tokenB.address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [account, UNISWAP_V2_ROUTER],
    });

    console.log(`${tokenB.symbol} 当前授权额度:`, formatUnits(allowanceB, tokenB.decimals));

    if (allowanceB < amountBWei) {
      console.log(`正在授权 ${tokenB.symbol}...`);
      const approveTxB = await writeContract({
        address: tokenB.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [UNISWAP_V2_ROUTER, maxUint256],
      });
      console.log(`${tokenB.symbol} 授权交易已发送，交易哈希:`, approveTxB);
      
      // 等待授权交易被确认
      const receipt = await waitForTransaction({
        hash: approveTxB,
        confirmations: 1,    // 等待 1 个确认
        timeout: 60_000,     // 60 秒超时
      });
      
      if (receipt.status === 'success') {
        console.log(`${tokenB.symbol} 授权交易已确认`);
      } else {
        throw new Error(`${tokenB.symbol} 授权交易失败`);
      }
    }

    // 4. 添加流动性
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20分钟后过期

    
    // 计算最小接受数量（考虑滑点）
    const amountAMin = BigInt(0); // BigInt(amountAWei) * BigInt(1000 - slippageTolerance * 10) / BigInt(1000);
    const amountBMin = BigInt(0); // BigInt(amountBWei) * BigInt(1000 - slippageTolerance * 10) / BigInt(1000);

    console.log('添加流动性参数:', {
      tokenA: {
        address: tokenA.address,
        amount: formatUnits(amountAWei, tokenA.decimals),
        min: formatUnits(amountAMin, tokenA.decimals)
      },
      tokenB: {
        address: tokenB.address,
        amount: formatUnits(amountBWei, tokenB.decimals),
        min: formatUnits(amountBMin, tokenB.decimals)
      },
      deadline: new Date(deadline * 1000).toLocaleString()
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

  } catch (error: any) {
    console.error('添加流动性详细错误:', error);
    // 更友好的错误提示
    if (error.message.includes('insufficient')) {
      throw new Error('代币余额不足');
    } else if (error.message.includes('EXPIRED')) {
      throw new Error('交易超时');
    } else if (error.message.includes('TRANSFER_FROM_FAILED')) {
      throw new Error('转账失败，请检查代币余额和授权');
    } else if (error.message.includes('execution reverted')) {
      throw new Error('交易被拒绝，请检查代币余额、授权额度和滑点设置');
    } else {
      throw new Error(`添加流动性失败: ${error.message}`);
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
  if (!tokenIn || !tokenOut || !amountIn || !publicClient) {
    console.log('Missing required parameters:', { tokenIn, tokenOut, amountIn, publicClient });
    return null;
  }

  try {
    // 先检查交易对是否存在
    const pairAddress = await readContract({
      address: UNISWAP_V2_FACTORY as `0x${string}`,
      abi: UNISWAP_V2_FACTORY_ABI,
      functionName: 'getPair',
      args: [tokenIn.address, tokenOut.address],
    });

    console.log('Pair address:', pairAddress);

    if (!pairAddress || pairAddress === '0x0000000000000000000000000000000000000000') {
      return {
        executionPrice: '0',
        nextMidPrice: '0',
        priceImpact: '0',
        amountOut: '0',
        minimumAmountOut: '0',
        error: '交易对不存在，需要先添加流动性'
      };
    }

    const amountInWei = parseUnits(amountIn, tokenIn.decimals);

    // 使用路由合约的 getAmountsOut 函数获取输出金额
    const amounts = await readContract({
      address: UNISWAP_V2_ROUTER as `0x${string}`,
      abi: UNISWAP_V2_ROUTER_ABI,
      functionName: 'getAmountsOut',
      args: [
        amountInWei,
        [tokenIn.address, tokenOut.address]
      ],
    }).catch(error => {
      console.error('Router getAmountsOut error:', error);
      return null;
    }) as bigint[] | null;

    if (!amounts || amounts.length < 2) {
      return {
        executionPrice: '0',
        nextMidPrice: '0',
        priceImpact: '0',
        amountOut: '0',
        minimumAmountOut: '0',
        error: '交易对流动性不足，请先添加流动性'
      };
    }

    const amountOutWei = amounts[1];
    
    // 计算价格和最小获得数量
    const executionPrice = Number(formatUnits(amountOutWei, tokenOut.decimals)) / 
                         Number(formatUnits(amountInWei, tokenIn.decimals));
    const minimumAmountOut = amountOutWei * BigInt(995) / BigInt(1000); // 0.5% 滑点

    return {
      executionPrice: executionPrice.toFixed(6),
      nextMidPrice: executionPrice.toFixed(6),
      priceImpact: '0.00',
      amountOut: formatUnits(amountOutWei, tokenOut.decimals),
      minimumAmountOut: formatUnits(minimumAmountOut, tokenOut.decimals),
    };

  } catch (error) {
    console.error('获取价格失败:', error);
    return {
      executionPrice: '0',
      nextMidPrice: '0',
      priceImpact: '0',
      amountOut: '0',
      minimumAmountOut: '0',
      error: '获取价格失败，请稍后重试'
    };
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
    console.log('Executing swap:', {
      tokenIn: tokenIn.symbol,
      tokenOut: tokenOut.symbol,
      amountIn,
      slippageTolerance
    });

    const amountInWei = parseUnits(amountIn, tokenIn.decimals);

    // 获取预期输出金额
    const amounts = await readContract({
      address: UNISWAP_V2_ROUTER as `0x${string}`,
      abi: UNISWAP_V2_ROUTER_ABI,
      functionName: 'getAmountsOut',
      args: [
        amountInWei,
        [tokenIn.address, tokenOut.address]
      ],
    }) as bigint[];

    if (!amounts || amounts.length < 2) {
      throw new Error('无法计算输出金额');
    }

    // 计算最小获得数量（考虑滑点）
    const minAmountOut = amounts[1] * BigInt(1000 - Math.floor(slippageTolerance * 10)) / BigInt(1000);

    // 检查代币授权
    const allowance = await readContract({
      address: tokenIn.address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [account, UNISWAP_V2_ROUTER],
    }) as bigint;

    // 如果授权不足，先进行授权
    if (allowance < amountInWei) {
      console.log('Approving tokens...');
      const approvalTx = await writeContract({
        address: tokenIn.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [UNISWAP_V2_ROUTER, maxUint256],
      });

      // 等待授权交易确认
      await waitForTransaction({
        hash: approvalTx,
        confirmations: 1,
      });
      console.log('Approval confirmed');
    }

    // 执行交换
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20分钟后过期
    console.log('Executing swap transaction...');
    const swapTx = await writeContract({
      address: UNISWAP_V2_ROUTER as `0x${string}`,
      abi: UNISWAP_V2_ROUTER_ABI,
      functionName: 'swapExactTokensForTokens',
      args: [
        amountInWei,
        minAmountOut,
        [tokenIn.address, tokenOut.address],
        account,
        BigInt(deadline),
      ],
    });

    return swapTx;
  } catch (error) {
    console.error('交易执行失败:', error);
    console.error('错误详情:', {
      tokenIn: {
        address: tokenIn.address,
        symbol: tokenIn.symbol,
        decimals: tokenIn.decimals
      },
      tokenOut: {
        address: tokenOut.address,
        symbol: tokenOut.symbol,
        decimals: tokenOut.decimals
      },
      amountIn,
      slippageTolerance
    });
    throw error;
  }
} 

export async function getPositions(address: string): Promise<Position[]> {
  return fetchPositions(address)
} 