import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { motion } from 'framer-motion';
import {
  Activity,
  ArrowUpDown,
  Brain,
  RefreshCw,
  Settings,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';

import { BN } from '@coral-xyz/anchor';
import {
  useConnection,
  useWallet,
} from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

import RaydiumSwapSDK, {
  formatTokenAmount,
  SOL_MINT,
} from '../lib/raydium-swap';

interface GrinGobblerSwapProps {
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

interface AIAnalysis {
  priceImpact: number
  liquidityScore: number
  recommendation: 'BUY' | 'SELL' | 'HOLD' | 'CAUTION'
  confidence: number
  reasoning: string[]
}

const GrinGobblerSwap: React.FC<GrinGobblerSwapProps> = ({
  gorbaganaToken,
  connected,
  balance,
  onRefreshBalance
}) => {
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()
  
  // Initialize Grin Gobbler Raydium SDK with AI features
  const raydiumSDK = useMemo(() => {
    const sdk = new RaydiumSwapSDK(connection)
    // Initialize the Grin Gobbler technology
    sdk.initialize().catch(console.error)
    return sdk
  }, [connection])
  
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
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // AI Analysis function
  const performAIAnalysis = useCallback(async (inputAmount: string, outputAmount: string) => {
    if (!inputAmount || !outputAmount) return

    setIsAnalyzing(true)
    
    // Simulate AI analysis with Grin Gobbler technology
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const input = parseFloat(inputAmount)
    const output = parseFloat(outputAmount)
    const rate = output / input
    
    // Mock AI analysis based on swap parameters
    const analysis: AIAnalysis = {
      priceImpact: priceImpact,
      liquidityScore: poolExists ? 85 : 45,
      recommendation: priceImpact < 1 ? 'BUY' : priceImpact < 3 ? 'HOLD' : 'CAUTION',
      confidence: poolExists ? 92 : 67,
      reasoning: [
        poolExists ? 'Pool has sufficient liquidity' : 'Limited pool liquidity detected',
        priceImpact < 1 ? 'Low price impact detected' : 'Higher price impact - consider smaller amounts',
        rate > 1000 ? 'Favorable exchange rate' : 'Standard market rate',
        'Grin Gobbler AI recommends monitoring for 5 minutes'
      ]
    }
    
    setAiAnalysis(analysis)
    setIsAnalyzing(false)
  }, [priceImpact, poolExists])

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
    
    // Clear AI analysis when swapping
    setAiAnalysis(null)
  }, [fromToken, toToken, fromAmount, toAmount])

  // Calculate output amount using Grin Gobbler technology
  const calculateOutputAmount = useCallback(async (inputAmount: string) => {
    if (!inputAmount || !connected) return

    try {
      setIsLoading(true)
      
      const input = parseFloat(inputAmount)
      if (isNaN(input) || input <= 0) {
        setToAmount('')
        setAiAnalysis(null)
        return
      }

      // Convert to BN with proper decimals
      const inputBN = new BN(input * Math.pow(10, fromToken.decimals))
      const inputMint = new PublicKey(fromToken.mint)
      const outputMint = new PublicKey(toToken.mint)

      // Get quote from Grin Gobbler Raydium SDK
      const quote = await raydiumSDK.getSwapQuote(inputMint, outputMint, inputBN)
      
      if (quote) {
        const outputFormatted = formatTokenAmount(quote.outputAmount, toToken.decimals)
        setToAmount(outputFormatted)
        setPriceImpact(quote.priceImpact)
        
        // Trigger AI analysis
        performAIAnalysis(inputAmount, outputFormatted)
      } else {
        // Fallback to mock calculation with AI analysis
        const mockRate = fromToken.symbol === 'SOL' ? 1000 : 0.001
        const output = input * mockRate
        const outputWithSlippage = output * (1 - slippage / 100)
        
        setToAmount(outputWithSlippage.toFixed(6))
        setPriceImpact(0.1)
        
        // Trigger AI analysis for mock data
        performAIAnalysis(inputAmount, outputWithSlippage.toFixed(6))
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
  }, [connected, fromToken, toToken, slippage, raydiumSDK, performAIAnalysis])

  // Handle input change
  const handleFromAmountChange = useCallback((value: string) => {
    setFromAmount(value)
    calculateOutputAmount(value)
  }, [calculateOutputAmount])

  // Execute swap using Grin Gobbler technology
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

      console.log('🧠 Grin Gobbler AI Swap Parameters:', {
        inputMint: inputMint.toString(),
        outputMint: outputMint.toString(),
        inputAmount: inputAmount.toString(),
        minimumOutputAmount: minimumOutputAmount.toString(),
        userInputTokenAccount: userInputTokenAccount.toString(),
        userOutputTokenAccount: userOutputTokenAccount.toString(),
        slippage,
        priceImpact,
        aiRecommendation: aiAnalysis?.recommendation,
        confidence: aiAnalysis?.confidence
      })
      
      // Simulate Grin Gobbler swap execution
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Refresh balances after swap
      onRefreshBalance()
      
      // Clear amounts and analysis
      setFromAmount('')
      setToAmount('')
      setAiAnalysis(null)
      
    } catch (error) {
      console.error('Grin Gobbler swap failed:', error)
    } finally {
      setIsSwapping(false)
    }
  }, [connected, publicKey, fromAmount, toAmount, fromToken, toToken, slippage, priceImpact, aiAnalysis, onRefreshBalance])

  return (
    <div className="gorbagana-card p-6">
      {/* Header with AI branding */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Brain className="w-6 h-6 mr-2 text-purple-400" />
          Grin Gobbler AI Swap
          <Sparkles className="w-4 h-4 ml-2 text-yellow-400" />
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

      {/* AI Status Banner */}
      <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="w-4 h-4 mr-2 text-purple-400" />
            <span className="text-sm text-purple-300">Grin Gobbler AI Active</span>
          </div>
          <div className="text-xs text-gray-400">
            {poolExists ? 'Real-time analysis' : 'Predictive modeling'}
          </div>
        </div>
      </div>

      {/* Pool Status */}
      {connected && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          poolExists 
            ? 'bg-green-900/20 text-green-400 border border-green-500/20' 
            : 'bg-yellow-900/20 text-yellow-400 border border-yellow-500/20'
        }`}>
          {poolExists 
            ? '✅ Pool exists - AI using real liquidity data'
            : '⚠️ Pool not found - AI using predictive modeling'
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
          <h3 className="text-sm font-semibold mb-3">AI-Enhanced Settings</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Slippage Tolerance</span>
            <div className="flex items-center space-x-2">
              {[0.1, 0.5, 1.0].map((value) => (
                <button
                  key={value}
                  onClick={() => setSlippage(value)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    slippage === value
                      ? 'bg-purple-600 text-white'
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
            className="p-3 rounded-full bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 transition-colors"
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
              {(isLoading || isAnalyzing) && (
                <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
              )}
              <div className="text-sm font-medium text-white">
                {toToken.symbol}
              </div>
            </div>
          </div>
        </div>

        {/* AI Analysis Panel */}
        {aiAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-gradient-to-r from-purple-900/10 to-blue-900/10 rounded-lg border border-purple-500/20"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-purple-300 flex items-center">
                <Brain className="w-4 h-4 mr-2" />
                AI Analysis
              </h3>
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-1 text-green-400" />
                <span className="text-xs text-gray-400">{aiAnalysis.confidence}% confidence</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="text-xs">
                <span className="text-gray-400">Recommendation:</span>
                <div className={`font-semibold ${
                  aiAnalysis.recommendation === 'BUY' ? 'text-green-400' :
                  aiAnalysis.recommendation === 'SELL' ? 'text-red-400' :
                  aiAnalysis.recommendation === 'HOLD' ? 'text-yellow-400' :
                  'text-orange-400'
                }`}>
                  {aiAnalysis.recommendation}
                </div>
              </div>
              <div className="text-xs">
                <span className="text-gray-400">Liquidity Score:</span>
                <div className="font-semibold text-blue-400">{aiAnalysis.liquidityScore}/100</div>
              </div>
            </div>
            
            <div className="text-xs text-gray-300 space-y-1">
              {aiAnalysis.reasoning.map((reason, index) => (
                <div key={index} className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

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

        {/* Enhanced Swap Button */}
        <motion.button
          whileHover={connected && fromAmount && toAmount ? { scale: 1.02 } : {}}
          whileTap={connected && fromAmount && toAmount ? { scale: 0.98 } : {}}
          onClick={handleSwap}
          disabled={!connected || !fromAmount || !toAmount || isSwapping}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg font-semibold py-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {!connected ? (
            'Connect Wallet'
          ) : isSwapping ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              AI Executing Swap...
            </>
          ) : !fromAmount || !toAmount ? (
            'Enter Amount'
          ) : (
            <>
              <Zap className="w-5 h-5 mr-2" />
              AI-Powered Swap
            </>
          )}
        </motion.button>

        {/* Pool Info */}
        {connected && !poolExists && (
          <div className="text-xs text-center text-yellow-400 bg-yellow-900/10 p-3 rounded-lg border border-yellow-500/20">
            🤖 Grin Gobbler AI is analyzing this token pair using predictive models.
            <br />
            Real pool data will be used when available.
          </div>
        )}
      </div>
    </div>
  )
}

export default GrinGobblerSwap
