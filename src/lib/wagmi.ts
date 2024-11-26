import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultWallets,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { configureChains, createConfig } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { QueryClient } from '@tanstack/react-query';
import { infuraProvider } from 'wagmi/providers/infura';

// 验证环境变量
const INFURA_ID = process.env.NEXT_PUBLIC_INFURA_ID;
const WALLET_CONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLET_CONNECT_ID;

if (!WALLET_CONNECT_PROJECT_ID) {
  throw new Error(
    'Missing NEXT_PUBLIC_WALLET_CONNECT_ID. Please add it to your .env.local file'
  );
}

if (!INFURA_ID) {
  throw new Error(
    'Missing NEXT_PUBLIC_INFURA_ID. Please add it to your .env.local file'
  );
}

const { chains, publicClient } = configureChains(
  [mainnet, sepolia],
  [
    infuraProvider({ apiKey: INFURA_ID }),
    publicProvider(),
  ],
  {
    batch: {
      multicall: true,
    },
    pollingInterval: 4_000,
    stallTimeout: 5_000,
    retryCount: 3,
    retryDelay: 1000,
  }
);

const { connectors } = getDefaultWallets({
  appName: 'Web3 DEX',
  projectId: WALLET_CONNECT_PROJECT_ID,
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: 1000,
      staleTime: 5000,
    },
  },
});

export { chains, wagmiConfig, queryClient }; 