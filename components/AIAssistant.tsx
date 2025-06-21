import React, { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, Sparkles, TrendingUp, Zap, MessageCircle } from 'lucide-react'
import { useConnection } from '@solana/wallet-adapter-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AIAssistantProps {}

const AIAssistant: React.FC<AIAssistantProps> = () => {
  const { connection } = useConnection()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your Gorbagana AI assistant. I can help you with blockchain analysis, trading insights, and understanding the Gorbagana ecosystem. What would you like to know?',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Call AI API (OpenAI or OpenRouter)
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage.trim(),
          context: {
            isConnected: !!connection,
            platform: 'gorbagana',
            topic: 'blockchain-trading'
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'I apologize, but I encountered an error processing your request.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('AI Chat Error:', error)
      
      // Fallback response
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I\'m currently experiencing some technical difficulties. Please try again later or ask a different question.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [inputMessage, isLoading, connection])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const quickQuestions = [
    "What is Gorbagana?",
    "How do I swap tokens?",
    "What are the current gas fees?",
    "Explain price impact",
    "Best trading strategies"
  ]

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question)
  }

  return (
    <div className="gorbagana-card p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="mr-3"
          >
            <Bot className="w-8 h-8 text-gorbagana-primary" />
          </motion.div>
          <div>
            <h3 className="text-xl font-bold text-white">Gorbagana AI Assistant</h3>
            <p className="text-sm text-gray-400">Powered by advanced blockchain intelligence</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-gorbagana-secondary animate-pulse" />
          <span className="text-xs text-gorbagana-secondary font-medium">ONLINE</span>
        </div>
      </div>

      {/* Quick Questions */}
      <div className="mb-4">
        <p className="text-sm text-gray-400 mb-2">Quick questions:</p>
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((question, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleQuickQuestion(question)}
              className="px-3 py-1 text-xs bg-gorbagana-primary/20 text-gorbagana-primary rounded-full hover:bg-gorbagana-primary/30 transition-colors"
            >
              {question}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto mb-4 space-y-4 scrollbar-thin scrollbar-thumb-gorbagana-primary scrollbar-track-gorbagana-darker">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-gorbagana-primary text-white'
                    : 'bg-gorbagana-darker/50 text-gray-200 border border-gorbagana-primary/20'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.role === 'assistant' && (
                    <Bot className="w-4 h-4 text-gorbagana-primary mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gorbagana-darker/50 text-gray-200 border border-gorbagana-primary/20 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-gorbagana-primary" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gorbagana-primary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gorbagana-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gorbagana-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="relative">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me anything about Gorbagana, blockchain, or trading..."
          className="gorbagana-input w-full pr-12 resize-none h-12 pt-3"
          rows={1}
          disabled={isLoading}
        />
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={sendMessage}
          disabled={!inputMessage.trim() || isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gorbagana-primary rounded-lg text-white hover:bg-gorbagana-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Footer */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          AI responses are generated and may not always be accurate. Always verify important information.
        </p>
      </div>
    </div>
  )
}

export default AIAssistant 