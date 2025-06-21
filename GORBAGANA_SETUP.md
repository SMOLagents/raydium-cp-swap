# Gorbagana Blockchain Swap Interface

A modern, AI-powered decentralized exchange interface built on Solana using the Raydium CP swap program.

## Features

🚀 **Modern UI/UX**
- Gorbagana-themed design with blockchain aesthetics
- Smooth animations and responsive layout
- Dark mode with purple/violet color scheme

⚡ **Swap Functionality** 
- Raydium Constant Product swap integration
- SOL ↔ GORB token swapping
- Real-time price calculations
- Slippage protection

🤖 **AI Assistant**
- OpenAI/OpenRouter integration
- Blockchain-focused responses
- Trading insights and education
- Context-aware conversations

📊 **Token Information**
- Real-time price data
- Market statistics
- Token holder information
- Contract address verification

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory:

```bash
HELIUS_RPC_URL=bozo
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Run Development Server

```bash
yarn dev
```

The application will be available at `http://localhost:3000`

## Architecture

### Frontend Stack
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Lucide React** - Icons

### Blockchain Integration
- **@solana/web3.js** - Solana blockchain interaction
- **@solana/wallet-adapter** - Wallet connectivity
- **@coral-xyz/anchor** - Solana program interaction
- **Raydium CP Swap** - DEX functionality

### AI Integration
- **OpenAI API** - Primary AI provider
- **OpenRouter API** - Fallback AI provider
- Custom prompts for blockchain/DeFi context

## Token Information

**Gorbagana Token (GORB)**
- Address: `h66r4cb3lrvezown6ejzxmvbjrzxmrzprt7z6amexunb`
- Blockchain: Solana
- Decimals: 9
- Type: SPL Token

## Key Components

### SwapInterface
- Main trading interface
- Token selection and amount input
- Price impact calculation
- Transaction execution

### AIAssistant  
- Chat interface with AI
- Blockchain education
- Trading guidance
- Risk management advice

### TokenInfo
- Real-time token statistics
- Price charts and trends
- Market data integration
- Contract verification

### Header
- Wallet connection
- Navigation menu
- Social links
- Branding

## API Endpoints

### `/api/ai-chat`
- Handles AI assistant conversations
- Integrates with OpenAI and OpenRouter
- Provides blockchain-specific responses
- Includes fallback responses

## Development

### File Structure
```
├── components/          # React components
│   ├── Header.tsx
│   ├── SwapInterface.tsx
│   ├── AIAssistant.tsx
│   └── TokenInfo.tsx
├── pages/              # Next.js pages
│   ├── api/           # API routes
│   ├── _app.tsx       # App wrapper
│   └── index.tsx      # Home page
├── styles/            # CSS styles
│   └── globals.css
└── public/            # Static assets
```

### Key Technologies
- **Raydium CP Swap Program**: `CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C`
- **Helius RPC**: Enhanced Solana RPC with additional APIs
- **Wallet Adapters**: Phantom, Solflare, Backpack support

## Trading Features

### Swap Execution
1. Connect Solana wallet
2. Select input/output tokens
3. Enter swap amount
4. Review price impact and fees
5. Confirm transaction

### Price Calculation
- Real-time price feeds
- Slippage tolerance settings
- Price impact warnings
- Fee estimation

### Risk Management
- Slippage protection
- Price impact alerts
- Transaction simulation
- Balance verification

## AI Assistant Features

### Capabilities
- Gorbagana ecosystem education
- DeFi trading strategies
- Risk management advice
- Technical analysis insights
- Market trend discussion

### Safety Features
- DYOR (Do Your Own Research) reminders
- Risk warnings for trading
- Educational focus over financial advice
- Context-aware responses

## Security Considerations

- Client-side wallet integration
- No private key storage
- RPC endpoint security
- API key protection
- Transaction simulation before execution

## Future Enhancements

- [ ] Advanced charting integration
- [ ] Liquidity pool creation
- [ ] Yield farming features
- [ ] Mobile app development
- [ ] Multi-chain support
- [ ] Advanced AI trading insights

## Support

For issues and questions:
- Check the Raydium documentation
- Review Solana developer resources
- Test on devnet before mainnet
- Monitor transaction fees and slippage

## License

This project is licensed under the Apache License, Version 2.0 - same as the underlying Raydium CP swap program. 
