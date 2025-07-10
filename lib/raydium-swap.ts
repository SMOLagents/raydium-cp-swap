import {
  AnchorProvider,
  BN,
  Program,
  Wallet,
} from '@coral-xyz/anchor';
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';

import {
  AmmV4Keys,
  ApiV3PoolInfoStandardItem,
} from './api/type';
import { TokenAmount } from './module/amount';
import { Token } from './module/token';
// Import the Grin Gobbler Raydium SDK
import { Raydium } from './raydium/raydium';

// Raydium CP Swap Program ID
export const RAYDIUM_CP_PROGRAM_ID = new PublicKey('CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C')

// Default AMM Config (from Anchor.toml)
export const DEFAULT_AMM_CONFIG = new PublicKey('D4FPEruKEHrG5TenZ2mpDGEfu1iUvTiqBxvpU8HLBvC2')

// Pool fee receiver
export const POOL_FEE_RECEIVER = new PublicKey('DNXgeM9EiiaAbaWvwjHj9fQQLAX5ZsfHyvmYUNRAdNC8')

// Gorbagana token mint
export const GORBAGANA_TOKEN_MINT = new PublicKey('h66r4cb3lrvezown6ejzxmvbjrzxmrzprt7z6amexunb')

// SOL mint (wrapped SOL)
export const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112')

export interface SwapParams {
  inputMint: PublicKey
  outputMint: PublicKey
  inputAmount: BN
  minimumOutputAmount: BN
  userInputTokenAccount: PublicKey
  userOutputTokenAccount: PublicKey
}

export interface PoolInfo {
  poolAddress: PublicKey
  token0Mint: PublicKey
  token1Mint: PublicKey
  token0Vault: PublicKey
  token1Vault: PublicKey
  lpMint: PublicKey
  token0Reserve: BN
  token1Reserve: BN
  lpSupply: BN
}

export class RaydiumSwapSDK {
  private connection: Connection
  private raydium: Raydium | null = null
  private program: Program<any> | null = null

  constructor(connection: Connection) {
    this.connection = connection
  }

  // Initialize the Grin Gobbler Raydium SDK
  async initialize() {
    try {
      this.raydium = await Raydium.load({
        connection: this.connection,
        cluster: "mainnet",
        apiRequestTimeout: 30000,
      })
      console.log('Grin Gobbler Raydium SDK initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Grin Gobbler Raydium SDK:', error)
      throw error
    }
  }

  // Initialize the program with a wallet
  initializeProgram(wallet: Wallet) {
    const provider = new AnchorProvider(this.connection, wallet, {})
    // You would need to load the IDL here
    // this.program = new Program(IDL, RAYDIUM_CP_PROGRAM_ID, provider)
  }

  // Get PDA addresses
  static getAmmConfigAddress(configIndex: number): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('amm_config'), Buffer.from([configIndex])],
      RAYDIUM_CP_PROGRAM_ID
    )
  }

  static getAuthAddress(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('vault_and_lp_mint_auth_seed')],
      RAYDIUM_CP_PROGRAM_ID
    )
  }

  static getPoolAddress(
    ammConfig: PublicKey,
    token0Mint: PublicKey,
    token1Mint: PublicKey
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('pool'),
        ammConfig.toBuffer(),
        token0Mint.toBuffer(),
        token1Mint.toBuffer(),
      ],
      RAYDIUM_CP_PROGRAM_ID
    )
  }

  static getPoolLpMintAddress(poolAddress: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('pool_lp_mint'), poolAddress.toBuffer()],
      RAYDIUM_CP_PROGRAM_ID
    )
  }

  static getPoolVaultAddress(
    poolAddress: PublicKey,
    tokenMint: PublicKey
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('pool_vault'), poolAddress.toBuffer(), tokenMint.toBuffer()],
      RAYDIUM_CP_PROGRAM_ID
    )
  }

  static getObservationAddress(poolAddress: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('observation'), poolAddress.toBuffer()],
      RAYDIUM_CP_PROGRAM_ID
    )
  }

  // Get route using Grin Gobbler technology
  async getRoute(inputMint: string, outputMint: string, amount: number) {
    if (!this.raydium) {
      throw new Error('Raydium SDK not initialized. Call initialize() first.')
    }

    const inputTokenInfo = await this.raydium.token.getTokenInfo(new PublicKey(inputMint))
    if (!inputTokenInfo) throw new Error("Input token not found")
    
    const inputToken = new Token({
      mint: new PublicKey(inputTokenInfo.address),
      decimals: inputTokenInfo.decimals,
      symbol: inputTokenInfo.symbol,
      name: inputTokenInfo.name,
    })

    const outputTokenInfo = await this.raydium.token.getTokenInfo(new PublicKey(outputMint))
    if (!outputTokenInfo) throw new Error("Output token not found")

    const inputAmount = new TokenAmount(inputToken, amount)

    // Get pool information from Raydium
    const poolList = await this.raydium.api.getPoolList()
    const pool = poolList.data.find(
      (p) =>
        p.type === "Standard" &&
        ((p.mintA.address === inputMint && p.mintB.address === outputMint) ||
          (p.mintA.address === outputMint && p.mintB.address === inputMint)),
    ) as ApiV3PoolInfoStandardItem

    if (!pool) throw new Error("No pool found for this pair")

    // Get pool keys
    const poolKeys = await this.raydium.api.fetchPoolKeysById({
      idList: [pool.id],
    })

    // Ensure we have AmmV4Keys
    const ammPoolKeys = poolKeys[0] as AmmV4Keys
    if (!ammPoolKeys) throw new Error("Invalid pool keys")

    // Get pool info with reserves
    const poolInfo = {
      ...pool,
      baseReserve: new BN(pool.mintAmountA),
      quoteReserve: new BN(pool.mintAmountB),
      version: 4 as const,
      status: 1,
    }

    // Compute swap route
    const amountOuts = await this.raydium.liquidity.computeAmountOut({
      poolInfo,
      amountIn: inputAmount.raw,
      mintIn: inputToken.mint,
      mintOut: new PublicKey(outputMint),
      slippage: 0.5,
    })

    return {
      inputAmount: amountOuts.amountOut.toString(),
      outputAmount: amountOuts.minAmountOut.toString(),
      priceImpact: amountOuts.priceImpact.toString(),
      fee: amountOuts.fee.toString(),
      pool,
      poolKeys: ammPoolKeys,
    }
  }

  // Execute swap using Grin Gobbler technology
  async swap(inputMint: string, outputMint: string, amount: number) {
    if (!this.raydium) {
      throw new Error('Raydium SDK not initialized. Call initialize() first.')
    }

    const route = await this.getRoute(inputMint, outputMint, amount)

    // Execute swap transaction
    const tx = await this.raydium.liquidity.swap({
      poolInfo: route.pool,
      poolKeys: route.poolKeys,
      amountIn: new BN(route.inputAmount),
      amountOut: new BN(route.outputAmount),
      fixedSide: "in",
      inputMint,
      config: {
        associatedOnly: true,
      },
    })

    return tx
  }

  // AI Agent for transaction indexing and analysis
  async analyzeTransaction(signature: string) {
    const txInfo = await this.connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    })

    if (!txInfo) throw new Error("Transaction not found")

    const logs = txInfo.meta?.logMessages || []
    const swapLogs = logs.filter((log) => log.includes("Program log: Instruction: Swap"))

    // Parse swap details from logs
    const parsedSwap = {
      signature,
      timestamp: txInfo.blockTime,
      success: txInfo.meta?.err === null,
      logs: swapLogs,
      inputToken: this.parseTokenFromLogs(swapLogs, "input"),
      outputToken: this.parseTokenFromLogs(swapLogs, "output"),
      amount: this.parseAmountFromLogs(swapLogs),
    }

    return parsedSwap
  }

  private parseTokenFromLogs(logs: string[], type: "input" | "output"): string | null {
    for (const log of logs) {
      if (log.includes(`${type} token:`)) {
        const match = log.match(new RegExp(`${type} token: (\\w+)`))
        if (match) return match[1]
      }
    }
    return null
  }

  private parseAmountFromLogs(logs: string[]): string | null {
    for (const log of logs) {
      if (log.includes("amount:")) {
        const match = log.match(/amount: (\d+)/)
        if (match) return match[1]
      }
    }
    return null
  }

  // Get pool information using Grin Gobbler technology
  async getPoolInfo(token0Mint: PublicKey, token1Mint: PublicKey): Promise<PoolInfo | null> {
    try {
      const [poolAddress] = RaydiumSwapSDK.getPoolAddress(
        DEFAULT_AMM_CONFIG,
        token0Mint,
        token1Mint
      )

      // Check if pool exists
      const poolAccount = await this.connection.getAccountInfo(poolAddress)
      if (!poolAccount) {
        return null
      }

      // Get vault addresses
      const [token0Vault] = RaydiumSwapSDK.getPoolVaultAddress(poolAddress, token0Mint)
      const [token1Vault] = RaydiumSwapSDK.getPoolVaultAddress(poolAddress, token1Mint)
      const [lpMint] = RaydiumSwapSDK.getPoolLpMintAddress(poolAddress)

      // Get vault balances (simplified - you'd need to parse the actual account data)
      const token0VaultAccount = await this.connection.getAccountInfo(token0Vault)
      const token1VaultAccount = await this.connection.getAccountInfo(token1Vault)

      return {
        poolAddress,
        token0Mint,
        token1Mint,
        token0Vault,
        token1Vault,
        lpMint,
        token0Reserve: new BN(0), // Would parse from vault account data
        token1Reserve: new BN(0), // Would parse from vault account data
        lpSupply: new BN(0), // Would parse from LP mint account data
      }
    } catch (error) {
      console.error('Error getting pool info:', error)
      return null
    }
  }

  // Calculate output amount for a given input (simplified constant product formula)
  calculateOutputAmount(
    inputAmount: BN,
    inputReserve: BN,
    outputReserve: BN,
    tradeFeeRate: number = 25 // 0.25% in basis points
  ): { outputAmount: BN; priceImpact: number } {
    // Apply trading fee
    const feeAmount = inputAmount.mul(new BN(tradeFeeRate)).div(new BN(10000))
    const inputAmountAfterFee = inputAmount.sub(feeAmount)

    // Constant product formula: (x + Δx) * (y - Δy) = x * y
    // Δy = (y * Δx) / (x + Δx)
    const outputAmount = outputReserve
      .mul(inputAmountAfterFee)
      .div(inputReserve.add(inputAmountAfterFee))

    // Calculate price impact
    const exactPrice = outputReserve.div(inputReserve)
    const executionPrice = outputAmount.div(inputAmount)
    const priceImpact = exactPrice.sub(executionPrice).div(exactPrice).toNumber() * 100

    return {
      outputAmount,
      priceImpact: Math.abs(priceImpact),
    }
  }

  // Create swap instruction
  async createSwapInstruction(
    params: SwapParams,
    userPublicKey: PublicKey
  ): Promise<TransactionInstruction | null> {
    if (!this.program) {
      throw new Error('Program not initialized')
    }

    try {
      // Determine token order (token0 < token1)
      const [token0, token1] = params.inputMint.toBuffer().compare(params.outputMint.toBuffer()) < 0
        ? [params.inputMint, params.outputMint]
        : [params.outputMint, params.inputMint]

      // Get pool address
      const [poolAddress] = RaydiumSwapSDK.getPoolAddress(DEFAULT_AMM_CONFIG, token0, token1)
      const [authAddress] = RaydiumSwapSDK.getAuthAddress()
      const [inputVault] = RaydiumSwapSDK.getPoolVaultAddress(poolAddress, params.inputMint)
      const [outputVault] = RaydiumSwapSDK.getPoolVaultAddress(poolAddress, params.outputMint)
      const [observationAddress] = RaydiumSwapSDK.getObservationAddress(poolAddress)

      // Determine token programs
      const inputTokenProgram = TOKEN_PROGRAM_ID // Could be TOKEN_2022_PROGRAM_ID for token extensions
      const outputTokenProgram = TOKEN_PROGRAM_ID

      // Create swap instruction
      const instruction = await this.program.methods
        .swapBaseInput(params.inputAmount, params.minimumOutputAmount)
        .accounts({
          payer: userPublicKey,
          authority: authAddress,
          ammConfig: DEFAULT_AMM_CONFIG,
          poolState: poolAddress,
          inputTokenAccount: params.userInputTokenAccount,
          outputTokenAccount: params.userOutputTokenAccount,
          inputVault,
          outputVault,
          inputTokenProgram,
          outputTokenProgram,
          inputTokenMint: params.inputMint,
          outputTokenMint: params.outputMint,
          observationState: observationAddress,
        })
        .instruction()

      return instruction
    } catch (error) {
      console.error('Error creating swap instruction:', error)
      return null
    }
  }

  // Get quote for a swap using Grin Gobbler technology
  async getSwapQuote(
    inputMint: PublicKey,
    outputMint: PublicKey,
    inputAmount: BN
  ): Promise<{ outputAmount: BN; priceImpact: number } | null> {
    try {
      if (this.raydium) {
        // Use Grin Gobbler technology for accurate quotes
        const route = await this.getRoute(inputMint.toString(), outputMint.toString(), inputAmount.toNumber())
        return {
          outputAmount: new BN(route.outputAmount),
          priceImpact: parseFloat(route.priceImpact)
        }
      } else {
        // Fallback to basic calculation
        const poolInfo = await this.getPoolInfo(inputMint, outputMint)
        if (!poolInfo) {
          return null
        }

        // Determine which reserve is input/output
        const isToken0Input = inputMint.equals(poolInfo.token0Mint)
        const inputReserve = isToken0Input ? poolInfo.token0Reserve : poolInfo.token1Reserve
        const outputReserve = isToken0Input ? poolInfo.token1Reserve : poolInfo.token0Reserve

        return this.calculateOutputAmount(inputAmount, inputReserve, outputReserve)
      }
    } catch (error) {
      console.error('Error getting swap quote:', error)
      return null
    }
  }

  // Check if a pool exists for the given token pair
  async poolExists(token0Mint: PublicKey, token1Mint: PublicKey): Promise<boolean> {
    try {
      if (this.raydium) {
        // Use Grin Gobbler technology to check pool existence
        const poolList = await this.raydium.api.getPoolList()
        const pool = poolList.data.find(
          (p) =>
            p.type === "Standard" &&
            ((p.mintA.address === token0Mint.toString() && p.mintB.address === token1Mint.toString()) ||
              (p.mintA.address === token1Mint.toString() && p.mintB.address === token0Mint.toString())),
        )
        return !!pool
      } else {
        // Fallback to basic check
        const poolInfo = await this.getPoolInfo(token0Mint, token1Mint)
        return poolInfo !== null
      }
    } catch (error) {
      console.error('Error checking pool existence:', error)
      return false
    }
  }

  // Get user token account address
  static getUserTokenAccount(
    userPublicKey: PublicKey,
    tokenMint: PublicKey,
    tokenProgram: PublicKey = TOKEN_PROGRAM_ID
  ): PublicKey {
    return getAssociatedTokenAddressSync(
      tokenMint,
      userPublicKey,
      false,
      tokenProgram
    )
  }
}

// Utility functions
export function sortTokenMints(mint1: PublicKey, mint2: PublicKey): [PublicKey, PublicKey] {
  return mint1.toBuffer().compare(mint2.toBuffer()) < 0 ? [mint1, mint2] : [mint2, mint1]
}

export function calculateSlippage(amount: BN, slippagePercent: number): BN {
  return amount.mul(new BN(slippagePercent * 100)).div(new BN(10000))
}

export function formatTokenAmount(amount: BN, decimals: number): string {
  const divisor = Math.pow(10, decimals)
  const amountNumber = amount.toNumber()
  const result = amountNumber / divisor
  
  return result.toFixed(6).replace(/\.?0+$/, '')
}

export default RaydiumSwapSDK
