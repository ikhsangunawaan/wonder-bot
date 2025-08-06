# 🤖 Wonder Discord Bot

A comprehensive Discord bot featuring economy system, introduction cards, games, role management, and exclusive perks for boosters and premium members.

## ✨ Features

### 💰 Economy System
- **WonderCash Currency**: Earn and spend virtual currency
- **Daily Rewards**: Claim daily WonderCash bonuses
- **Work System**: Work every hour to earn more currency
- **Transaction History**: Track all your earnings and spending
- **Leaderboard**: Compete with other members

### 🎮 Interactive Games
- **Coin Flip**: Bet on heads or tails
- **Dice Rolling**: Roll dice for various multipliers
- **Slot Machine**: Try your luck with emoji slots

### 📝 Introduction Cards
- **Custom Cards**: Create beautiful introduction cards with your info
- **Image Generation**: Automatically generated images with Canvas
- **Form Interface**: Easy-to-use modal forms
- **Channel Integration**: Auto-post to introduction channels

### 🎭 Role Management & Perks
- **Server Booster Benefits**: Extra rewards for server boosters
- **Premium Member Perks**: VIP benefits for premium role holders
- **Exclusive Channels**: Access to booster and premium lounges
- **Auto Role Assignment**: Automatic role management

### 🎉 Welcome System
- **Welcome Messages**: Customizable welcome messages for new members
- **Introduction Button**: Quick access to create introduction cards
- **Server Setup**: Admin commands to configure channels

### ⚡ Modern Interface
- **Slash Commands**: Full slash command support
- **Prefix Commands**: Traditional `w.` prefix commands
- **Interactive Buttons**: Click-to-interact features
- **Beautiful Embeds**: Rich, colorful message embeds

## 🚀 Quick Start

### Prerequisites
- Node.js 16.9.0 or higher
- A Discord bot token
- Basic knowledge of Discord bot setup

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd wonder-discord-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your bot credentials:
   ```env
   DISCORD_TOKEN=your_discord_bot_token_here
   CLIENT_ID=your_discord_client_id_here
   GUILD_ID=your_guild_id_here (optional, for development)
   WELCOME_CHANNEL_ID=welcome_channel_id
   INTRODUCTION_CHANNEL_ID=introduction_channel_id
   BOOSTER_ROLE_ID=server_booster_role_id
   PREMIUM_ROLE_ID=premium_paid_role_id
   ```

4. **Start the bot**
   ```bash
   npm start
   ```
   
   For development:
   ```bash
   npm run dev
   ```

## 📋 Commands

### 💰 Economy Commands
| Command | Description | Usage |
|---------|-------------|-------|
| `w.balance` / `/balance` | Check WonderCash balance | `w.balance [@user]` |
| `w.daily` / `/daily` | Claim daily reward | `w.daily` |
| `w.work` / `/work` | Work to earn WonderCash | `w.work` |
| `w.leaderboard` / `/leaderboard` | View top earners | `w.leaderboard` |

### 🎮 Game Commands
| Command | Description | Usage |
|---------|-------------|-------|
| `w.coinflip` / `/coinflip` | Coin flip betting game | `w.coinflip heads 100` |
| `w.dice` / `/dice` | Dice rolling game | `w.dice 50` |
| `w.slots` / `/slots` | Slot machine game | `w.slots 25` |

### 📝 Introduction Commands
| Command | Description | Usage |
|---------|-------------|-------|
| `/intro create` | Create introduction card | `/intro create` |
| `/intro view` | View introduction cards | `/intro view [@user]` |

### 💎 Role Commands
| Command | Description | Usage |
|---------|-------------|-------|
| `w.perks` | View your role perks | `w.perks` |

### ⚙️ Admin Commands
| Command | Description | Usage |
|---------|-------------|-------|
| `/setup welcome` | Setup welcome system | `/setup welcome #channel [message]` |
| `/setup introduction` | Setup intro channel | `/setup introduction #channel` |

### ℹ️ Utility Commands
| Command | Description | Usage |
|---------|-------------|-------|
| `w.help` / `/help` | Show all commands | `w.help` |

## 💎 Role Perks

### 🚀 Server Booster Benefits
- **+50** WonderCash daily bonus
- **+25** WonderCash work bonus
- Access to exclusive #booster-lounge
- Special recognition in community
- Auto-role assignment on boost

### ⭐ Premium Member Benefits
- **+100** WonderCash daily bonus
- **+50** WonderCash work bonus
- Access to exclusive #premium-lounge
- Custom embed colors
- Priority support
- VIP treatment

## 🛠️ Configuration

### Bot Settings (`config.json`)
```json
{
  "prefix": "w.",
  "currency": {
    "name": "WonderCash",
    "symbol": "💰",
    "dailyAmount": 100,
    "workAmount": 50
  },
  "booster": {
    "dailyBonus": 50,
    "workBonus": 25,
    "exclusiveChannels": true
  },
  "premium": {
    "dailyBonus": 100,
    "workBonus": 50,
    "exclusiveChannels": true,
    "customColor": true
  }
}
```

### Game Settings
- **Coin Flip**: Bet 10-1000 WonderCash
- **Dice**: Bet 10-500 WonderCash
- **Slots**: Bet 20-200 WonderCash

## 📁 Project Structure

```
wonder-discord-bot/
├── src/
│   ├── index.js              # Main bot file
│   ├── database.js           # SQLite database management
│   ├── slash-commands.js     # Slash command definitions
│   ├── slash-handlers.js     # Slash command handlers
│   ├── role-manager.js       # Role and perks management
│   └── utils/
│       └── canvas.js         # Image generation utilities
├── config.json               # Bot configuration
├── package.json              # Dependencies and scripts
├── .env.example             # Environment variables template
└── README.md                # This file
```

## 🗄️ Database Schema

The bot uses SQLite with the following tables:
- `users` - User economy data
- `introduction_cards` - Introduction card information
- `server_settings` - Per-server configuration
- `transactions` - Transaction history

## 🎨 Customization

### Colors
The bot uses a consistent color scheme defined in `config.json`:
- **Primary**: #7C3AED (Purple)
- **Success**: #10B981 (Green)
- **Error**: #EF4444 (Red)
- **Warning**: #F59E0B (Amber)
- **Info**: #3B82F6 (Blue)

### Introduction Cards
- Canvas-based image generation
- Customizable backgrounds based on favorite color
- User avatar integration
- Responsive text wrapping

## 🔧 Development

### Adding New Commands
1. Add command to `loadCommands()` in `src/index.js`
2. For slash commands, add to `src/slash-commands.js`
3. Add handler to `src/slash-handlers.js`

### Database Changes
1. Modify schema in `database.js`
2. Add new methods as needed
3. Test with development database

### Adding Game Features
1. Create game logic in command handler
2. Add betting validation
3. Update transaction system
4. Test thoroughly

## 🐛 Troubleshooting

### Common Issues

**Bot not responding to commands:**
- Check if bot has correct permissions
- Verify DISCORD_TOKEN is valid
- Ensure bot is in the server

**Slash commands not appearing:**
- Check CLIENT_ID is correct
- Verify bot has application commands permission
- Try restarting the bot

**Database errors:**
- Ensure write permissions in bot directory
- Check SQLite installation
- Verify database file isn't corrupted

**Canvas/Image generation errors:**
- Install canvas dependencies for your system
- Check if user avatars are accessible
- Verify file write permissions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 💬 Support

For support, questions, or feature requests:
- Create an issue on GitHub
- Join our Discord server
- Check the documentation

## 📈 Roadmap

- [ ] Web dashboard for server management
- [ ] More interactive games
- [ ] Custom role creation system
- [ ] Integration with external APIs
- [ ] Mobile-friendly introduction cards
- [ ] Advanced economy features (shops, items)

---

**Wonder Bot** - Making Discord communities amazing! ✨