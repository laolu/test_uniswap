'use client';

import { useState, useEffect } from 'react';
import { ArrowDownIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';
import { useAccount, useWalletClient, usePublicClient, useContractRead } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import TokenSelector from '@/components/TokenSelector';
import { getPrice, executeSwap } from '@/services/uniswap';
import {Token, DAI, USDC ,USDT,WETH } from '@/constants/tokens';
import { readContract } from '@wagmi/core';
import { UNISWAP_V2_FACTORY, UNISWAP_V2_FACTORY_ABI, UNISWAP_V2_PAIR_ABI } from '@/constants/contracts';
import { formatUnits } from 'viem';
import Image from 'next/image'
import { ERC20_ABI } from '@/constants/contracts';

interface PoolInfo {
  reserve0: bigint
  reserve1: bigint
  totalSupply: bigint
  myShare: bigint
}

// 定义需要的 ABI
const PAIR_ABI = [
  {
    "inputs": [],
    "name": "getReserves",
    "outputs": [
      {
        "internalType": "uint112",
        "name": "_reserve0",
        "type": "uint112"
      },
      {
        "internalType": "uint112",
        "name": "_reserve1",
        "type": "uint112"
      },
      {
        "internalType": "uint32",
        "name": "_blockTimestampLast",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

const FACTORY_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "tokenA",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "tokenB",
        "type": "address"
      }
    ],
    "name": "getPair",
    "outputs": [
      {
        "internalType": "address",
        "name": "pair",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

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
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null)

  // 获取用户代币余额
  const { data: tokenInBalance } = useContractRead({
    address: selectedTokenIn?.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    enabled: !!selectedTokenIn?.address && !!address,
    watch: true,
  })

  const { data: tokenOutBalance } = useContractRead({
    address: selectedTokenOut?.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    enabled: !!selectedTokenOut?.address && !!address,
    watch: true,
  })

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

  // 获取池子信息
  useEffect(() => {
    async function fetchPoolInfo() {
      if (!selectedTokenIn || !selectedTokenOut || !address) {
        setPoolInfo(null)
        return
      }

      try {
        // 获取交易对地址
        const pairAddress = await readContract({
          address: UNISWAP_V2_FACTORY as `0x${string}`,
          abi: FACTORY_ABI,
          functionName: 'getPair',
          args: [selectedTokenIn.address, selectedTokenOut.address],
        }) as `0x${string}`

        if (pairAddress === '0x0000000000000000000000000000000000000000') {
          setPoolInfo(null)
          return
        }

        // 获取池子储备量
        const [reserve0, reserve1] = await readContract({
          address: pairAddress,
          abi: PAIR_ABI,
          functionName: 'getReserves',
        }) as [bigint, bigint]

        setPoolInfo({
          reserve0,
          reserve1,
          totalSupply: BigInt(0),
          myShare: BigInt(0),
        })
      } catch (error) {
        console.error('获取池子信息失败:', error)
        setPoolInfo(null)
      }
    }

    fetchPoolInfo()
  }, [selectedTokenIn, selectedTokenOut, address])

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
    <div className="max-w-lg mx-auto mt-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">代币交换</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              以最优价格交换代币
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* 支付代币输入 */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-500 dark:text-gray-400">支付</label>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                池子余额: {poolInfo ? Number(formatUnits(poolInfo.reserve0, selectedTokenIn?.decimals || 18)).toFixed(6) : '0'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="number"
                value={tokenInAmount}
                onChange={(e) => setTokenInAmount(e.target.value)}
                placeholder="0.0"
                className="w-full bg-transparent text-2xl outline-none dark:text-white"
              />
              <button 
                onClick={() => setShowTokenSelector('in')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {selectedTokenIn && selectedTokenIn.icon && (
                  <div className="w-5 h-5 rounded-full overflow-hidden">
                    <Image
                      src={selectedTokenIn.icon}
                      alt={selectedTokenIn.symbol}
                      width={20}
                      height={20}
                    />
                  </div>
                )}
                <span>{selectedTokenIn.symbol}</span>
              </button>
            </div>
          </div>

          {/* 交换按钮 */}
          <div className="flex justify-center h-0">
            <div className="relative -top-3">
              <button
                onClick={switchTokens}
                className={`
                  flex items-center justify-center
                  w-10 h-10
                  bg-white dark:bg-gray-800 
                  border border-gray-200 dark:border-gray-700
                  rounded-xl
                  shadow-sm
                  transition-all
                  hover:bg-gray-50 dark:hover:bg-gray-700 
                  hover:border-gray-300 dark:hover:border-gray-600
                `}
              >
                <ArrowsUpDownIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* 接收代币输入 */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-500 dark:text-gray-400">接收</label>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                池子余额: {poolInfo ? Number(formatUnits(poolInfo.reserve1, selectedTokenOut?.decimals || 18)).toFixed(6) : '0'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={priceInfo?.amountOut || ''}
                readOnly
                placeholder="0.0"
                className="w-full bg-transparent text-2xl outline-none dark:text-white"
              />
              <button 
                onClick={() => setShowTokenSelector('out')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {selectedTokenOut && selectedTokenOut.icon && (
                  <div className="w-5 h-5 rounded-full overflow-hidden">
                    <Image
                      src={selectedTokenOut.icon}
                      alt={selectedTokenOut.symbol}
                      width={20}
                      height={20}
                    />
                  </div>
                )}
                <span>{selectedTokenOut.symbol}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 价格信息 */}
        {priceInfo && !priceInfo.error && (
          <div className="mt-4 bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  最小接收
                </span>
                <span className="text-sm font-medium">
                  {priceInfo.minimumAmountOut} {selectedTokenOut.symbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  兑换率
                </span>
                <span className="text-sm font-medium">
                  1 {selectedTokenIn.symbol} = {priceInfo.executionPrice} {selectedTokenOut.symbol}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {priceInfo?.error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <span className="text-sm text-red-600 dark:text-red-400">
              {priceInfo.error}
            </span>
          </div>
        )}

        {/* 交换按钮 */}
        <button
          onClick={handleSwap}
          disabled={isLoading || !tokenInAmount || !priceInfo || priceInfo.error}
          className="w-full mt-6 py-4 bg-blue-500 dark:bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '交易处理中...' : '交换'}
        </button>
      </div>

      {/* 代币选择器 */}
      <TokenSelector
        isOpen={showTokenSelector !== null}
        onClose={() => setShowTokenSelector(null)}
        onSelect={handleTokenSelect}
        selectedTokens={[]}
      />
    </div>
  );
} 