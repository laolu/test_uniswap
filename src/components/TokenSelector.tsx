'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Token, COMMON_TOKENS } from '@/constants/tokens';

interface TokenSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  selectedTokens?: string[];
}

export default function TokenSelector({ 
  isOpen, 
  onClose, 
  onSelect, 
  selectedTokens = [] 
}: TokenSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTokens = COMMON_TOKENS.filter(token => 
    !selectedTokens.includes(token.address) &&
    (token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
     token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     token.address.toLowerCase() === searchQuery.toLowerCase())
  );

  return (
    <Transition.Root show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                      选择代币
                    </Dialog.Title>
                    <div className="mt-4">
                      <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="block w-full rounded-md border-0 py-3 pl-10 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600"
                          placeholder="搜索代币名称或地址"
                        />
                      </div>

                      <div className="mt-4 space-y-2">
                        {filteredTokens.length === 0 ? (
                          <div className="text-center py-4 text-gray-500">
                            未找到代币
                          </div>
                        ) : (
                          filteredTokens.map((token) => (
                            <button
                              key={token.address}
                              className="w-full flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                              onClick={() => {
                                onSelect(token)
                                onClose()
                              }}
                            >
                              <div className="flex flex-col items-start">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {token.symbol}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {token.name}
                                </span>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 