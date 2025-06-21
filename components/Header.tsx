import React from 'react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { motion } from 'framer-motion'
import { Sparkles, Github, Twitter } from 'lucide-react'

const Header: React.FC = () => {
  return (
    <header className="border-b border-gorbagana-primary/20 backdrop-blur-lg bg-gorbagana-dark/80">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-3"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-8 h-8 text-gorbagana-primary" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold bg-gorbagana-gradient bg-clip-text text-transparent">
                Gorbagana
              </h1>
              <p className="text-xs text-gray-400">Blockchain Swap</p>
            </div>
          </motion.div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <motion.a
              whileHover={{ scale: 1.05 }}
              href="#swap"
              className="text-gray-300 hover:text-gorbagana-primary transition-colors"
            >
              Swap
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.05 }}
              href="#pools"
              className="text-gray-300 hover:text-gorbagana-primary transition-colors"
            >
              Pools
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.05 }}
              href="#analytics"
              className="text-gray-300 hover:text-gorbagana-primary transition-colors"
            >
              Analytics
            </motion.a>
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Social Links */}
            <div className="hidden md:flex items-center space-x-3">
              <motion.a
                whileHover={{ scale: 1.1 }}
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gorbagana-primary transition-colors"
              >
                <Github className="w-5 h-5" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1 }}
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gorbagana-primary transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </motion.a>
            </div>

            {/* Wallet Button */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <WalletMultiButton className="!bg-gorbagana-gradient hover:!scale-105 !transition-transform !duration-200" />
            </motion.div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header 