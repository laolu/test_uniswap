'use client';

import { useState, useEffect } from 'react';
import { ArrowDownIcon } from '@heroicons/react/24/outline';
import { useAccount, usePublicClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import TokenSelector from '@/components/TokenSelector';
import { TOKENS, addInitialLiquidity, createPair } from '@/services/uniswap';
import { Token } from '@uniswap/sdk';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AddLiquidityPage() {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const publicClient = usePublicClient();
  
  const [isLoading, setIsLoading] = useState(false);
  const [tokenAAmount, setTokenAAmount] = useState('');
  const [tokenBAmount, setTokenBAmount] = useState('');
  const [selectedTokenA, setSelectedTokenA] = useState<Token>(TOKENS.WETH);
  const [selectedTokenB, setSelectedTokenB] = useState<Token>(TOKENS.USDC);
  const [showTokenSelector, setShowTokenSelector] = useState<'A' | 'B' | null>(null);
  const [priceInfo, setPriceInfo] = useState<any>(null);

  const handleAddLiquidity = async () => {
    if (!isConnected || !address || !tokenAAmount || !tokenBAmount) return;
    setIsLoading(true);

    try {
      // 先尝试创建交易对
      await createPair(selectedTokenA, selectedTokenB);
      
      // 添加流动性
      const tx = await addInitialLiquidity(
        selectedTokenA,
        selectedTokenB,
        tokenAAmount,
        tokenBAmount,
        address
      );
      console.log('添加流动性成功:', tx);
      
      // 重定向到池子页面
      router.push('/pool');
    } catch (error) {
      console.error('添加流动性失败:', error);
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
                  <span className="text-sm text-gray-500">余额: 0.0</span>
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
                  <span className="text-sm text-gray-500">余额: 0.0</span>
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