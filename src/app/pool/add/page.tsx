'use client';

import { useState, useEffect } from 'react';
import { ArrowDownIcon } from '@heroicons/react/24/outline';
import { useAccount, usePublicClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import TokenSelector from '@/components/TokenSelector';
import { addInitialLiquidity, createPair } from '@/services/uniswap';
import { Token } from '@uniswap/sdk';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { readContract } from '@wagmi/core';
import { ERC20_ABI } from '@/constants/abis';
import { formatUnits } from 'viem';
import { DAI, USDC ,USDT,WETH } from '@/constants/tokens';
import { UNISWAP_V2_FACTORY } from '@/services/uniswap';
import { UNISWAP_V2_PAIR_ABI, UNISWAP_V2_FACTORY_ABI } from '@/constants/abis';

export default function AddLiquidityPage() {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const publicClient = usePublicClient();
  
  const [isLoading, setIsLoading] = useState(false);
  const [tokenAAmount, setTokenAAmount] = useState('');
  const [tokenBAmount, setTokenBAmount] = useState('');
  const [selectedTokenA, setSelectedTokenA] = useState<Token>(DAI);
  const [selectedTokenB, setSelectedTokenB] = useState<Token>(USDC);
  const [showTokenSelector, setShowTokenSelector] = useState<'A' | 'B' | null>(null);
  const [priceInfo, setPriceInfo] = useState<any>(null);
  const [tokenABalance, setTokenABalance] = useState<string>('0');
  const [tokenBBalance, setTokenBBalance] = useState<string>('0');

  const handleAddLiquidity = async () => {
    if (!isConnected || !address || !tokenAAmount || !tokenBAmount) return;
    setIsLoading(true);

    try {
      // 创建或获取已存在的交易对
      const pairResult = await createPair(selectedTokenA, selectedTokenB);
      console.log('交易对地址:', pairResult);
      
      // 添加流动性
      const tx = await addInitialLiquidity(
        selectedTokenA,
        selectedTokenB,
        tokenAAmount,
        tokenBAmount,
        address
      );
      console.log('添加流动性成:', tx);
      
      // 重定向到池子页面
      router.push('/pool');
    } catch (error: any) {
      console.error('添加流动性失败:', error);
      // 这里可以添加错误提示
      // alert(error.message || '操作失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenSelect = (token: Token) => {
    if (showTokenSelector === 'A') {
      if (token.address === selectedTokenB.address) {
        setSelectedTokenB(selectedTokenA);
      }
      setSelectedTokenA(token);
    } else {
      if (token.address === selectedTokenA.address) {
        setSelectedTokenA(selectedTokenB);
      }
      setSelectedTokenB(token);
    }
    setShowTokenSelector(null);
  };

  const fetchBalances = async () => {
    if (!address) return;

    try {
      // 获取交易对地址
      const pairAddress = await readContract({
        address: UNISWAP_V2_FACTORY as `0x${string}`,
        abi: UNISWAP_V2_FACTORY_ABI,
        functionName: 'getPair',
        args: [selectedTokenA.address, selectedTokenB.address],
      }).catch(() => null);

      // 如果交易对存在且地址有效，尝试获取池中余额
      if (pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000') {
        try {
          const [reserveA, reserveB] = await readContract({
            address: pairAddress as `0x${string}`,
            abi: UNISWAP_V2_PAIR_ABI.abi,
            functionName: 'getReserves',
          }) as [bigint, bigint, number];

          const token0Address = await readContract({
            address: pairAddress as `0x${string}`,
            abi: UNISWAP_V2_PAIR_ABI.abi,
            functionName: 'token0',
          }) as `0x${string}`;

          const [poolBalanceA, poolBalanceB] = token0Address.toLowerCase() === selectedTokenA.address.toLowerCase()
            ? [reserveA, reserveB]
            : [reserveB, reserveA];

          setTokenABalance(formatUnits(poolBalanceA, selectedTokenA.decimals));
          setTokenBBalance(formatUnits(poolBalanceB, selectedTokenB.decimals));
          return;
        } catch (error) {
          console.error('获取池中余额失败:', error);
        }
      }

      // 如果交易对不存在或获取池中余额失败，显示余额为 0
      setTokenABalance('0');
      setTokenBBalance('0');

    } catch (error) {
      console.error('获取余额失败:', error);
      // 发生错误时设置余额为 0
      setTokenABalance('0');
      setTokenBBalance('0');
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [address, selectedTokenA.address, selectedTokenB.address]);

  return (
    <div className="max-w-lg mx-auto mt-8 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <Link 
            href="/pool"
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ← 返回
          </Link>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">添加流动性</h2>
          <div className="w-8" /> {/* 为了保持标题居中 */}
        </div>

        {!isConnected ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              请先连接钱包
            </p>
            <ConnectButton />
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-gray-500">第一个代币数量</label>
                  <span className="text-sm text-gray-500">
                    池中余额: {Number(tokenABalance).toFixed(6)}
                  </span>
                </div>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={tokenAAmount}
                    onChange={(e) => setTokenAAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-transparent text-2xl outline-none dark:text-white"
                  />
                  <button 
                    onClick={() => setShowTokenSelector('A')}
                    className="ml-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-xl text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    {selectedTokenA.symbol}
                  </button>
                </div>
              </div>

              <div className="flex justify-center -my-2 z-10 relative">
                <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                  <ArrowDownIcon className="h-5 w-5 text-gray-500" />
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-gray-500">第二个代币数量</label>
                  <span className="text-sm text-gray-500">
                    池中余额: {Number(tokenBBalance).toFixed(6)}
                  </span>
                </div>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={tokenBAmount}
                    onChange={(e) => setTokenBAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-transparent text-2xl outline-none dark:text-white"
                  />
                  <button 
                    onClick={() => setShowTokenSelector('B')}
                    className="ml-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-xl text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    {selectedTokenB.symbol}
                  </button>
                </div>
              </div>
            </div>

            {tokenAAmount && tokenBAmount && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">价格比率</span>
                  <span className="text-gray-800 dark:text-gray-200">
                    1 {selectedTokenA.symbol} = {Number(tokenBAmount) / Number(tokenAAmount)} {selectedTokenB.symbol}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-500">份额</span>
                  <span className="text-gray-800 dark:text-gray-200">100%</span>
                </div>
              </div>
            )}

            <button
              onClick={handleAddLiquidity}
              disabled={isLoading || !tokenAAmount || !tokenBAmount}
              className={`w-full mt-4 py-4 px-6 rounded-xl text-lg font-semibold ${
                isLoading || !tokenAAmount || !tokenBAmount
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white transition-colors`}
            >
              {isLoading ? '处理中...' : '添加流动性'}
            </button>
          </>
        )}
      </div>

      <TokenSelector
        isOpen={showTokenSelector !== null}
        onClose={() => setShowTokenSelector(null)}
        onSelect={handleTokenSelect}
      />
    </div>
  );
} 