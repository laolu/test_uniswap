'use client';

import { useState, useEffect } from 'react';
import { ArrowDownIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import TokenSelector from '@/components/TokenSelector';
import { getPrice, executeSwap } from '@/services/uniswap';
import {Token, DAI, USDC ,USDT,WETH } from '@/constants/tokens';

export default function SwapPage() {
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  const [isLoading, setIsLoading] = useState(false);
  const [tokenInAmount, setTokenInAmount] = useState('');
  const [selectedTokenIn, setSelectedTokenIn] = useState<Token>(DAI);
  const [selectedTokenOut, setSelectedTokenOut] = useState<Token>(USDC);
  const [showTokenSelector, setShowTokenSelector] = useState<'in' | 'out' | null>(null);
  const [priceInfo, setPriceInfo] = useState<any>(null);

  // 获取价格报价
  useEffect(() => {
    if (!tokenInAmount || !selectedTokenIn || !selectedTokenOut || Number(tokenInAmount) <= 0) {
      setPriceInfo(null);
      return;
    }

    const fetchPrice = async () => {
      try {
        const price = await getPrice(
          selectedTokenIn,
          selectedTokenOut,
          tokenInAmount,
          publicClient
        );
        setPriceInfo(price);
      } catch (error) {
        console.error('获取价格失败:', error);
        setPriceInfo(null);
      }
    };

    fetchPrice();
  }, [tokenInAmount, selectedTokenIn, selectedTokenOut, publicClient]);

  const handleSwap = async () => {
    if (!isConnected || !address || !tokenInAmount || !priceInfo || !walletClient) return;
    setIsLoading(true);

    try {
      const tx = await executeSwap(
        selectedTokenIn,
        selectedTokenOut,
        tokenInAmount,
        0.5,
        walletClient,
        address
      );
      console.log('交易成功:', tx);
      setTokenInAmount('');
      setPriceInfo(null);
    } catch (error) {
      console.error('交易失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenSelect = (token: Token) => {
    if (showTokenSelector === 'in') {
      if (token.address === selectedTokenOut.address) {
        setSelectedTokenOut(selectedTokenIn);
      }
      setSelectedTokenIn(token);
    } else {
      if (token.address === selectedTokenIn.address) {
        setSelectedTokenIn(selectedTokenOut);
      }
      setSelectedTokenOut(token);
    }
    setShowTokenSelector(null);
  };

  const switchTokens = () => {
    setSelectedTokenIn(selectedTokenOut);
    setSelectedTokenOut(selectedTokenIn);
    setTokenInAmount('');
    setPriceInfo(null);
  };

  return (
    <div className="max-w-lg mx-auto mt-8 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">代币交换</h2>
          <button 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            onClick={switchTokens}
          >
            <ArrowsUpDownIcon className="h-5 w-5 text-gray-500" />
          </button>
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
                  <label className="text-sm text-gray-500">支付</label>
                  <span className="text-sm text-gray-500">余额: 0.0</span>
                </div>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={tokenInAmount}
                    onChange={(e) => setTokenInAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-transparent text-2xl outline-none dark:text-white"
                  />
                  <button 
                    onClick={() => setShowTokenSelector('in')}
                    className="ml-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-xl text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    {selectedTokenIn.symbol}
                  </button>
                </div>
              </div>

              <div className="flex justify-center -my-2 z-10 relative">
                <button className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">
                  <ArrowDownIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-gray-500">接收</label>
                  <span className="text-sm text-gray-500">余额: 0.0</span>
                </div>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={priceInfo?.amountOut || ''}
                    readOnly
                    placeholder="0.0"
                    className="w-full bg-transparent text-2xl outline-none dark:text-white"
                  />
                  <button 
                    onClick={() => setShowTokenSelector('out')}
                    className="ml-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-xl text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    {selectedTokenOut.symbol}
                  </button>
                </div>
              </div>
            </div>

            {priceInfo && priceInfo.error ? (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <span className="text-sm text-red-600 dark:text-red-400">
                  {priceInfo.error}
                </span>
              </div>
            ) : priceInfo && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">价格影响</span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {priceInfo.priceImpact}%
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-500">最小接收</span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {priceInfo.minimumAmountOut} {selectedTokenOut.symbol}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-500">兑换率</span>
                  <span className="text-gray-800 dark:text-gray-200">
                    1 {selectedTokenIn.symbol} = {priceInfo.executionPrice} {selectedTokenOut.symbol}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleSwap}
              disabled={isLoading || !tokenInAmount || !priceInfo}
              className={`w-full mt-4 py-4 px-6 rounded-xl text-lg font-semibold ${
                isLoading || !tokenInAmount || !priceInfo
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white transition-colors`}
            >
              {isLoading ? '交易处理中...' : '交换'}
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