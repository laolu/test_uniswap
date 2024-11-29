import { Token, Fetcher, Route, Trade, TokenAmount, TradeType, Percent } from '@uniswap/sdk';
import { UNISWAP_V2_ROUTER_ABI, ERC20_ABI, UNISWAP_V2_FACTORY_ABI } from '@/constants/abis';
import { getContract, readContract, writeContract, waitForTransaction } from '@wagmi/core';
import { parseUnits, formatUnits, maxUint256 } from 'viem';
import { SEPOLIA_CHAIN_ID } from '@/constants/chains';
import { ethers } from 'ethers';

// Sepolia 测试网上的合约地址
export const UNISWAP_V2_ROUTER = '0x3361623A4E323e0d3f170b8f39124A5CAccdC725';
export const UNISWAP_V2_FACTORY = '0x4603870b4e0825956842a823cDdDa35426b9Ca01';

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

<<<<<<< HEAD
    // 计算最小接受数量（考虑滑点）
    const amountAMin = 0;//BigInt(amountAWei) * BigInt(1000 - slippageTolerance * 10) / BigInt(1000);
    const amountBMin = 0;BigInt(amountBWei) * BigInt(1000 - slippageTolerance * 10) / BigInt(1000);

    // 添加流动性
=======
    // 4. 添加流动性
>>>>>>> 9617820a2ea516e12dbed38d32a49fdbc49cc6c7
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20分钟后过期
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
<<<<<<< HEAD
  } catch (error) {
    // 提供更详细的错误信息
=======
  } catch (error: any) {
    console.error('添加流动性详细错误:', error);
    
    // 更友好的错误提示
>>>>>>> 9617820a2ea516e12dbed38d32a49fdbc49cc6c7
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
      abi: UNISWAP_V2_FACTORY_ABI,
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