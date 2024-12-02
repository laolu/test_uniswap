'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Token, DAI, USDC, USDT, WETH } from '@/constants/tokens';
import Image from 'next/image';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  selectedTokens?: string[];
}

const COMMON_TOKENS = [DAI, USDC, USDT, WETH];

export default function TokenSelector({ isOpen, onClose, onSelect, selectedTokens = [] }: Props) {
  const availableTokens = COMMON_TOKENS.filter(
    token => !selectedTokens.includes(token.address)
  );

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                <Dialog.Title className="text-lg font-medium mb-4">
                  选择代币
                </Dialog.Title>

                <div className="space-y-2">
                  {availableTokens.map((token) => (
                    <button
                      key={token.address}
                      onClick={() => {
                        onSelect(token)
                        onClose()
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {token.icon ? (
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                          <Image
                            src={token.icon}
                            alt={token.symbol}
                            width={32}
                            height={32}
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {token.symbol.slice(0, 2)}
                          </span>
                        </div>
                      )}
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{token.symbol}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {token.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 