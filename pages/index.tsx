import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  Bot,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';

import {
  useConnection,
  useWallet,
} from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

import Header from '../components/Header';
import SwapInterface from '../components/SwapInterface';
import TokenInfo from '../components/TokenInfo';

// Gorbagana token address
const GORBAGANA_TOKEN = 'h66r4cb3lrvezown6ejzxmvbjrzxmrzprt7z6amexunb'

export default function Home() {
  const { connection } = useConnection()
  const { publicKey, connected } = useWallet()
  const [balance, setBalance] = useState<number>(0)
  const [tokenBalance, setTokenBalance] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showAI, setShowAI] = useState(false)

  const fetchBalances = useCallback(async () => {
    if (!publicKey || !connection) return

    try {
      setIsLoading(true)
      
      // Fetch SOL balance
      const solBalance = await connection.getBalance(publicKey)
      setBalance(solBalance / LAMPORTS_PER_SOL)

      // TODO: Fetch Gorbagana token balance
      // This would require implementing SPL token balance fetching
      setTokenBalance(0)
    } catch (error) {
      console.error('Error fetching balances:', error)
    } finally {
      setIsLoading(false)
    }
  }, [publicKey, connection])

  useEffect(() => {
    fetchBalances()
  }, [fetchBalances])

  return (
    <div className="min-h-screen bg-blockchain-gradient">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="mr-4">
              <Sparkles className="w-12 h-12 text-gorbagana-primary" />
            </div>
            <h1 className="text-6xl font-bold bg-gorbagana-gradient bg-clip-text text-transparent">
              Gorbagana Swap
            </h1>
            <div className="ml-4">
              <Zap className="w-12 h-12 text-gorbagana-secondary" />
            </div>
          </div>
          
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Experience the future of decentralized trading with AI-powered insights 
            and blockchain-native swaps on the Gorbagana protocol.
          </p>

          {!connected && (
            <div className="mb-8">
              <WalletMultiButton className="gorbagana-button text-lg px-8 py-4" />
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Swap Interface */}
          <div className="lg:col-span-2">
            <SwapInterface 
              gorbaganaToken={GORBAGANA_TOKEN}
              connected={connected}
              balance={balance}
              onRefreshBalance={fetchBalances}
            />
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Wallet Info */}
            {connected && (
              <div className="gorbagana-card p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-gorbagana-primary" />
                  Wallet Overview
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">SOL Balance:</span>
                    <span className="font-semibold">
                      {isLoading ? '...' : balance.toFixed(4)} SOL
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">GORB Balance:</span>
                    <span className="font-semibold">
                      {isLoading ? '...' : tokenBalance.toFixed(2)} GORB
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Token Info */}
            <TokenInfo tokenAddress={GORBAGANA_TOKEN} />

            {/* AI Assistant Toggle */}
            <button
              onClick={() => setShowAI(!showAI)}
              className="w-full gorbagana-button flex items-center justify-center"
            >
              <Bot className="w-5 h-5 mr-2" />
              {showAI ? 'Hide' : 'Show'} AI Assistant
            </button>
          </div>
        </div>

        {/* AI Assistant */}
        {showAI && (
          <div className="mt-8">
            <div className="gorbagana-card p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Bot className="w-5 h-5 mr-2 text-gorbagana-primary" />
                AI Assistant (Coming Soon)
              </h3>
              <p className="text-gray-400">
                AI-powered trading insights and recommendations will be available here.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
