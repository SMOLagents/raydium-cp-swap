import type { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

interface ChatRequest {
  message: string
  context?: {
    isConnected: boolean
    platform: string
    topic: string
  }
}

interface ChatResponse {
  response: string
  error?: string
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// OpenRouter client as fallback
const openRouterClient = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
})

const GORBAGANA_SYSTEM_PROMPT = `You are the Gorbagana AI Assistant, an expert in blockchain technology, DeFi trading, and the Gorbagana ecosystem. You help users with:

1. Gorbagana token (GORB) information and trading
2. Raydium constant product swap mechanics
3. Solana blockchain concepts
4. DeFi trading strategies and best practices
5. Risk management in cryptocurrency trading
6. Technical analysis and market insights

Key Gorbagana Information:
- Token: GORB (h66r4cb3lrvezown6ejzxmvbjrzxmrzprt7z6amexunb)
- Built on Solana blockchain
- Uses Raydium CP swap for decentralized trading
- Focuses on community-driven DeFi innovation

Guidelines:
- Be helpful, accurate, and educational
- Explain complex concepts in simple terms
- Always recommend users to do their own research (DYOR)
- Warn about risks in cryptocurrency trading
- Stay updated on current blockchain trends
- Be enthusiastic about the Gorbagana ecosystem while remaining objective

If you don't know something specific, admit it and suggest where users can find more information.`

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ response: '', error: 'Method not allowed' })
  }

  try {
    const { message, context }: ChatRequest = req.body

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ response: '', error: 'Invalid message' })
    }

    // Prepare the conversation with context
    const contextInfo = context ? `
User Context:
- Connected to wallet: ${context.isConnected ? 'Yes' : 'No'}
- Platform: ${context.platform}
- Topic: ${context.topic}
    ` : ''

    const userMessage = `${contextInfo}\n\nUser Question: ${message}`

    let aiResponse: string

    try {
      // Try OpenAI first
      if (process.env.OPENAI_API_KEY) {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: GORBAGANA_SYSTEM_PROMPT },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 500,
          temperature: 0.7,
        })

        aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response.'
      } else {
        throw new Error('OpenAI API key not available')
      }
    } catch (openaiError) {
      console.log('OpenAI failed, trying OpenRouter...', openaiError)
      
      // Fallback to OpenRouter
      if (process.env.OPENROUTER_API_KEY) {
        const completion = await openRouterClient.chat.completions.create({
          model: 'anthropic/claude-3-haiku', // or another model available on OpenRouter
          messages: [
            { role: 'system', content: GORBAGANA_SYSTEM_PROMPT },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 500,
          temperature: 0.7,
        })

        aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response.'
      } else {
        throw new Error('Both OpenAI and OpenRouter APIs are unavailable')
      }
    }

    // Add some Gorbagana-specific enhancements to the response
    const enhancedResponse = enhanceGorbaganaResponse(aiResponse, message)

    res.status(200).json({ response: enhancedResponse })
  } catch (error) {
    console.error('AI Chat API Error:', error)
    
    // Provide a fallback response based on the user's question
    const fallbackResponse = generateFallbackResponse(req.body.message)
    
    res.status(200).json({ response: fallbackResponse })
  }
}

function enhanceGorbaganaResponse(response: string, userMessage: string): string {
  // Add Gorbagana-specific context or formatting
  const lowerMessage = userMessage.toLowerCase()
  
  if (lowerMessage.includes('gorbagana') || lowerMessage.includes('gorb')) {
    return `🚀 ${response}\n\n💡 Remember: Always DYOR (Do Your Own Research) before making any trading decisions with GORB tokens!`
  }
  
  if (lowerMessage.includes('swap') || lowerMessage.includes('trade')) {
    return `⚡ ${response}\n\n🔗 Use the Gorbagana Swap interface above to trade GORB tokens with minimal slippage!`
  }
  
  return response
}

function generateFallbackResponse(message: string): string {
  const lowerMessage = message?.toLowerCase() || ''
  
  if (lowerMessage.includes('gorbagana') || lowerMessage.includes('gorb')) {
    return `🌟 Gorbagana (GORB) is an innovative token built on the Solana blockchain, featuring:

• Decentralized trading via Raydium CP swap
• Community-driven DeFi innovation
• Low transaction fees on Solana
• Transparent and secure smart contracts

Token Address: h66r4cb3lrvezown6ejzxmvbjrzxmrzprt7z6amexunb

Would you like to know more about any specific aspect of Gorbagana?`
  }
  
  if (lowerMessage.includes('swap') || lowerMessage.includes('trade')) {
    return `💱 Trading with Gorbagana Swap:

1. Connect your Solana wallet
2. Select tokens to swap (SOL ↔ GORB)
3. Enter the amount you want to trade
4. Review price impact and fees
5. Confirm the transaction

Always check slippage settings and ensure you have enough SOL for transaction fees!`
  }
  
  if (lowerMessage.includes('price') || lowerMessage.includes('value')) {
    return `📊 For current GORB price and market data:

• Check the Token Info panel on the right
• Visit DexScreener or Solscan for detailed charts
• Monitor 24h volume and price changes
• Consider market trends before trading

Remember: Cryptocurrency prices are highly volatile. Never invest more than you can afford to lose!`
  }
  
  return `🤖 I'm the Gorbagana AI Assistant! I can help you with:

• Gorbagana token information
• How to use the swap interface
• Blockchain and DeFi concepts
• Trading strategies and tips
• Risk management advice

What would you like to learn about today?`
} 