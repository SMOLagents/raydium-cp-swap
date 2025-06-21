import React, { useState, useEffect } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Coins } from 'lucide-react'

interface TokenInfoProps {
  tokenAddress: string
}

interface TokenData {
  price: number
  priceChange24h: number
  volume24h: number
  marketCap: number
  supply: number
  holders: number
}

const TokenInfo: React.FC<TokenInfoProps> = ({ tokenAddress }) => {
  const { connection } = useConnection()
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTokenInfo = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // In a real implementation, you would fetch this data from:
        // 1. Helius API for token metadata
        // 2. Jupiter API for price data
        // 3. Solscan API for holder data
        // 4. DexScreener API for trading data

        // Mock data for demonstration
        const mockData: TokenData = {
          price: 0.00123,
          priceChange24h: 15.67,
          volume24h: 125000,
          marketCap: 1234567,
          supply: 1000000000,
          holders: 5432
        }

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setTokenData(mockData)
      } catch (err) {
        setError('Failed to fetch token information')
        console.error('Token info fetch error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (tokenAddress) {
      fetchTokenInfo()
    }
  }, [tokenAddress, connection])

  const formatNumber = (num: number, decimals: number = 2) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(decimals)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(decimals)}M`
    if (num >= 1e3) return `$${(num / 1e3).toFixed(decimals)}K`
    return `$${num.toFixed(decimals)}`
  }

  const formatSupply = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`
    return num.toString()
  }

  if (isLoading) {
    return (
      <div className="gorbagana-card p-6">
        <div className="animate-pulse">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-gorbagana-primary/20 rounded-full mr-3" />
            <div className="h-6 bg-gorbagana-primary/20 rounded w-32" />
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-gorbagana-primary/20 rounded w-20" />
                <div className="h-4 bg-gorbagana-primary/20 rounded w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="gorbagana-card p-6">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  if (!tokenData) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="gorbagana-card p-6"
    >
      {/* Header */}
      <div className="flex items-center mb-6">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="mr-3"
        >
          <Coins className="w-8 h-8 text-gorbagana-primary" />
        </motion.div>
        <div>
          <h3 className="text-lg font-bold text-white">GORB Token</h3>
          <p className="text-xs text-gray-400">Gorbagana Ecosystem</p>
        </div>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold text-white">
            ${tokenData.price.toFixed(6)}
          </span>
          <div className={`flex items-center ${
            tokenData.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {tokenData.priceChange24h >= 0 ? (
              <TrendingUp className="w-4 h-4 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 mr-1" />
            )}
            <span className="font-semibold">
              {tokenData.priceChange24h >= 0 ? '+' : ''}{tokenData.priceChange24h.toFixed(2)}%
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-400">24h Change</p>
      </div>

      {/* Stats */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm flex items-center">
            <DollarSign className="w-4 h-4 mr-1" />
            Market Cap
          </span>
          <span className="text-white font-semibold">
            {formatNumber(tokenData.marketCap)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm flex items-center">
            <BarChart3 className="w-4 h-4 mr-1" />
            24h Volume
          </span>
          <span className="text-white font-semibold">
            {formatNumber(tokenData.volume24h)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Total Supply</span>
          <span className="text-white font-semibold">
            {formatSupply(tokenData.supply)} GORB
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Holders</span>
          <span className="text-white font-semibold">
            {tokenData.holders.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Contract Address */}
      <div className="mt-6 pt-4 border-t border-gorbagana-primary/20">
        <p className="text-xs text-gray-400 mb-2">Contract Address</p>
        <div className="flex items-center justify-between bg-gorbagana-darker/30 rounded p-2">
          <span className="text-xs font-mono text-gray-300 truncate mr-2">
            {tokenAddress}
          </span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigator.clipboard.writeText(tokenAddress)}
            className="text-xs text-gorbagana-primary hover:text-gorbagana-secondary transition-colors"
          >
            Copy
          </motion.button>
        </div>
      </div>

      {/* Links */}
      <div className="mt-4 flex space-x-2">
        <motion.a
          whileHover={{ scale: 1.05 }}
          href={`https://solscan.io/token/${tokenAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center py-2 px-3 bg-gorbagana-primary/20 text-gorbagana-primary rounded text-xs font-medium hover:bg-gorbagana-primary/30 transition-colors"
        >
          Solscan
        </motion.a>
        <motion.a
          whileHover={{ scale: 1.05 }}
          href={`https://dexscreener.com/solana/${tokenAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center py-2 px-3 bg-gorbagana-primary/20 text-gorbagana-primary rounded text-xs font-medium hover:bg-gorbagana-primary/30 transition-colors"
        >
          DexScreener
        </motion.a>
      </div>
    </motion.div>
  )
}

export default TokenInfo 