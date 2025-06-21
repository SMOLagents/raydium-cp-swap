import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { motion } from 'framer-motion'
import { ArrowUpDown, RefreshCw, Settings, Zap } from 'lucide-react'
import { BN } from '@coral-xyz/anchor'
import RaydiumSwapSDK, { 
  GORBAGANA_TOKEN_MINT, 
  SOL_MINT,
  sortTokenMints,
  calculateSlippage,
  formatTokenAmount
} from '../lib/raydium-swap'

interface SwapInterfaceProps {
  gorbaganaToken: string
  connected: boolean
  balance: number
  onRefreshBalance: () => void
}

interface TokenInfo {
  mint: string
  symbol: string
  name: string
  decimals: number
  logoURI?: string
}

const SwapInterface: React.FC<SwapInterfaceProps> = ({
  gorbaganaToken,
  connected,
  balance,
  onRefreshBalance
}) => {
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()
  
  // Initialize Raydium SDK
  const raydiumSDK = useMemo(() => new RaydiumSwapSDK(connection), [connection])
  
  // State
  const [fromToken, setFromToken] = useState<TokenInfo>({
    mint: SOL_MINT.toString(),
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9
  })
  
  const [toToken, setToToken] = useState<TokenInfo>({
    mint: gorbaganaToken,
    symbol: 'GORB',
    name: 'Gorbagana',
    decimals: 9
  })
  
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [slippage, setSlippage] = useState(0.5)
  const [isSwapping, setIsSwapping] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [priceImpact, setPriceImpact] = useState(0)
  const [poolExists, setPoolExists] = useState(false)

  // Check if pool exists
  useEffect(() => {
    const checkPool = async () => {
      if (!connected) return
      
      try {
        const inputMint = new PublicKey(fromToken.mint)
        const outputMint = new PublicKey(toToken.mint)
        const exists = await raydiumSDK.poolExists(inputMint, outputMint)
        setPoolExists(exists)
      } catch (error) {
        console.error('Error checking pool:', error)
        setPoolExists(false)
      }
    }

    checkPool()
  }, [fromToken.mint, toToken.mint, connected, raydiumSDK])

  // Swap tokens
  const handleSwapTokens = useCallback(() => {
    const tempToken = fromToken
    setFromToken(toToken)
    setToToken(tempToken)
    
    const tempAmount = fromAmount
    setFromAmount(toAmount)
    setToAmount(tempAmount)
  }, [fromToken, toToken, fromAmount, toAmount])

  // Calculate output amount using Raydium SDK
  const calculateOutputAmount = useCallback(async (inputAmount: string) => {
    if (!inputAmount || !connected || !poolExists) return

    try {
      setIsLoading(true)
      
      const input = parseFloat(inputAmount)
      if (isNaN(input) || input <= 0) {
        setToAmount('')
        return
      }

      // Convert to BN with proper decimals
      const inputBN = new BN(input * Math.pow(10, fromToken.decimals))
      const inputMint = new PublicKey(fromToken.mint)
      const outputMint = new PublicKey(toToken.mint)

      // Get quote from Raydium SDK
      const quote = await raydiumSDK.getSwapQuote(inputMint, outputMint, inputBN)
      
      if (quote) {
        const outputFormatted = formatTokenAmount(quote.outputAmount, toToken.decimals)
        setToAmount(outputFormatted)
        setPriceImpact(quote.priceImpact)
      } else {
        // Fallback to mock calculation if pool doesn't exist or quote fails
        const mockRate = fromToken.symbol === 'SOL' ? 1000 : 0.001
        const output = input * mockRate
        const outputWithSlippage = output * (1 - slippage / 100)
        
        setToAmount(outputWithSlippage.toFixed(6))
        setPriceImpact(0.1)
      }
      
    } catch (error) {
      console.error('Error calculating output amount:', error)
      // Fallback calculation
      const input = parseFloat(inputAmount)
      const mockRate = fromToken.symbol === 'SOL' ? 1000 : 0.001
      const output = input * mockRate
      setToAmount((output * (1 - slippage / 100)).toFixed(6))
      setPriceImpact(0.1)
    } finally {
      setIsLoading(false)
    }
  }, [connected, poolExists, fromToken, toToken, slippage, raydiumSDK])

  // Handle input change
  const handleFromAmountChange = useCallback((value: string) => {
    setFromAmount(value)
    calculateOutputAmount(value)
  }, [calculateOutputAmount])

  // Execute swap using Raydium SDK
  const handleSwap = useCallback(async () => {
    if (!connected || !publicKey || !fromAmount || !toAmount) return

    try {
      setIsSwapping(true)
      
      const inputAmount = new BN(parseFloat(fromAmount) * Math.pow(10, fromToken.decimals))
      const minimumOutputAmount = new BN(
        parseFloat(toAmount) * Math.pow(10, toToken.decimals) * (1 - slippage / 100)
      )
      
      const inputMint = new PublicKey(fromToken.mint)
      const outputMint = new PublicKey(toToken.mint)
      
      // Get user token accounts
      const userInputTokenAccount = RaydiumSwapSDK.getUserTokenAccount(publicKey, inputMint)
      const userOutputTokenAccount = RaydiumSwapSDK.getUserTokenAccount(publicKey, outputMint)

      // Create swap instruction (would need proper program initialization)
      // For now, we'll simulate the swap
      console.log('Swap Parameters:', {
        inputMint: inputMint.toString(),
        outputMint: outputMint.toString(),
        inputAmount: inputAmount.toString(),
        minimumOutputAmount: minimumOutputAmount.toString(),
        userInputTokenAccount: userInputTokenAccount.toString(),
        userOutputTokenAccount: userOutputTokenAccount.toString(),
        slippage,
        priceImpact
      })
      
      // Mock delay for demonstration
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In a real implementation, you would:
      // 1. Create the swap instruction using raydiumSDK.createSwapInstruction()
      // 2. Build and send the transaction
      // 3. Wait for confirmation
      
      // Refresh balances after swap
      onRefreshBalance()
      
      // Clear amounts
      setFromAmount('')
      setToAmount('')
      
    } catch (error) {
      console.error('Swap failed:', error)
    } finally {
      setIsSwapping(false)
    }
  }, [connected, publicKey, fromAmount, toAmount, fromToken, toToken, slippage, priceImpact, onRefreshBalance])

  return (
    <div className="gorbagana-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Zap className="w-6 h-6 mr-2 text-gorbagana-primary" />
          Gorbagana Swap
        </h2>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-lg bg-gorbagana-darker/50 text-gray-400 hover:text-white transition-colors"
        >
          <Settings className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Pool Status */}
      {connected && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          poolExists 
            ? 'bg-green-900/20 text-green-400 border border-green-500/20' 
            : 'bg-yellow-900/20 text-yellow-400 border border-yellow-500/20'
        }`}>
          {poolExists 
            ? '✅ Pool exists - Real pricing available'
            : '⚠️ Pool not found - Using mock pricing'
          }
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6 p-4 bg-gorbagana-darker/30 rounded-lg border border-gorbagana-primary/20"
        >
          <h3 className="text-sm font-semibold mb-3">Transaction Settings</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Slippage Tolerance</span>
            <div className="flex items-center space-x-2">
              {[0.1, 0.5, 1.0].map((value) => (
                <button
                  key={value}
                  onClick={() => setSlippage(value)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    slippage === value
                      ? 'bg-gorbagana-primary text-white'
                      : 'bg-gorbagana-darker/50 text-gray-400 hover:text-white'
                  }`}
                >
                  {value}%
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* From Token */}
      <div className="space-y-4">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-400 mb-2">From</label>
          <div className="relative">
            <input
              type="number"
              value={fromAmount}
              onChange={(e) => handleFromAmountChange(e.target.value)}
              placeholder="0.00"
              className="gorbagana-input w-full pr-24 text-lg font-medium"
              disabled={!connected}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
              <div className="text-sm font-medium text-white">
                {fromToken.symbol}
              </div>
            </div>
          </div>
          {fromToken.symbol === 'SOL' && (
            <div className="text-xs text-gray-400 mt-1">
              Balance: {balance.toFixed(4)} SOL
            </div>
          )}
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSwapTokens}
            className="p-3 rounded-full bg-gorbagana-primary/20 text-gorbagana-primary hover:bg-gorbagana-primary/30 transition-colors"
          >
            <ArrowUpDown className="w-5 h-5" />
          </motion.button>
        </div>

        {/* To Token */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-400 mb-2">To</label>
          <div className="relative">
            <input
              type="number"
              value={toAmount}
              readOnly
              placeholder="0.00"
              className="gorbagana-input w-full pr-24 text-lg font-medium bg-gorbagana-darker/30"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
              {isLoading && (
                <RefreshCw className="w-4 h-4 animate-spin text-gorbagana-primary" />
              )}
              <div className="text-sm font-medium text-white">
                {toToken.symbol}
              </div>
            </div>
          </div>
        </div>

        {/* Price Info */}
        {fromAmount && toAmount && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-gray-400 space-y-1"
          >
            <div className="flex justify-between">
              <span>Price Impact:</span>
              <span className={priceImpact > 5 ? 'text-red-400' : 'text-green-400'}>
                {priceImpact.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Network Fee:</span>
              <span>~0.00025 SOL</span>
            </div>
            <div className="flex justify-between">
              <span>Min. Received:</span>
              <span>
                {(parseFloat(toAmount) * (1 - slippage / 100)).toFixed(6)} {toToken.symbol}
              </span>
            </div>
          </motion.div>
        )}

        {/* Swap Button */}
        <motion.button
          whileHover={connected && fromAmount && toAmount ? { scale: 1.02 } : {}}
          whileTap={connected && fromAmount && toAmount ? { scale: 0.98 } : {}}
          onClick={handleSwap}
          disabled={!connected || !fromAmount || !toAmount || isSwapping}
          className="w-full gorbagana-button text-lg font-semibold py-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {!connected
            ? 'Connect Wallet'
            : isSwapping
            ? 'Swapping...'
            : !fromAmount || !toAmount
            ? 'Enter Amount'
            : 'Swap'}
        </motion.button>

        {/* Pool Info */}
        {connected && !poolExists && (
          <div className="text-xs text-center text-yellow-400 bg-yellow-900/10 p-3 rounded-lg border border-yellow-500/20">
            ⚠️ This token pair doesn't have a Raydium CP pool yet. 
            <br />
            Showing estimated pricing for demonstration.
          </div>
        )}
      </div>
    </div>
  )
}

export default SwapInterface 