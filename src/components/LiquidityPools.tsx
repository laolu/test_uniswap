'use client';

import { useEffect, useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { Token } from '@uniswap/sdk';
import { COMMON_TOKENS } from '@/constants/tokens';
import { readContract } from '@wagmi/core';
import { UNISWAP_V2_FACTORY, FACTORY_ABI } from '@/services/uniswap';

interface Pool {
  token0: Token;
  token1: Token;
  pairAddress: string;
  userLiquidity?: string;
}

export default function LiquidityPools() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [pools, setPools] = useState<Pool[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPools = async () => {
      try {
        const poolPromises: Promise<Pool | null>[] = [];
        
        // 获取所有可能的代币对组合
        for (let i = 0; i < COMMON_TOKENS.length; i++) {
          for (let j = i + 1; j < COMMON_TOKENS.length; j++) {
            const token0 = COMMON_TOKENS[i];
            const token1 = COMMON_TOKENS[j];
            
            poolPromises.push(
              (async () => {
                try {
                  const pairAddress = await readContract({
                    address: UNISWAP_V2_FACTORY as `0x${string}`,
                    abi: FACTORY_ABI,
                    functionName: 'getPair',
                    args: [token0.address, token1.address],
                  });

                  if (pairAddress === '0x0000000000000000000000000000000000000000') {
                    return null;
                  }

                  return {
                    token0,
                    token1,
                    pairAddress: pairAddress as string,
                  };
                } catch (error) {
                  console.error('获取交易对失败:', error);
                  return null;
                }
              })()
            );
          }
        }

        const results = await Promise.all(poolPromises);
        const existingPools = results.filter((pool): pool is Pool => pool !== null);
        setPools(existingPools);
      } catch (error) {
        console.error('获取流动性池失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPools();
  }, [publicClient]);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">加载中...</p>
      </div>
    );
  }

  if (pools.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
        <p className="text-gray-500 dark:text-gray-400">
          暂无流动性池
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pools.map((pool) => (
        <div
          key={pool.pairAddress}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="font-medium">
                {pool.token0.symbol}/{pool.token1.symbol}
              </span>
            </div>
            <button
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              onClick={() => window.location.href = `/pool/add?token0=${pool.token0.address}&token1=${pool.token1.address}`}
            >
              添加流动性
            </button>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            <p>交易对地址: {pool.pairAddress}</p>
          </div>
        </div>
      ))}
    </div>
  );
} 