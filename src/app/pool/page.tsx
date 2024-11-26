'use client';

import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function PoolPage() {
  const { isConnected } = useAccount();

  return (
    <div className="max-w-lg mx-auto mt-8 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">您的流动性</h2>
          <Link
            href="/pool/add"
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            添加流动性
          </Link>
        </div>

        {!isConnected ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              您的钱包尚未连接
            </p>
            <ConnectButton />
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
            <p className="text-gray-500 dark:text-gray-400">
              暂无流动性
            </p>
            <Link
              href="/pool/add"
              className="text-blue-600 hover:text-blue-700 mt-2 inline-block"
            >
              添加流动性
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 