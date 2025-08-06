# 🏆 Wonder Bot Leveling System

The Wonder Bot now features a comprehensive multi-tiered leveling system that rewards user activity across different categories!

## 📊 Level Types

### 💬 Text Level
- **How to earn:** Send messages in chat channels
- **XP per message:** 15-25 XP (based on message length)
- **Cooldown:** 1 minute between XP gains
- **Bonuses:** Longer messages (>50 characters) give bonus XP

### 🎤 Voice Level  
- **How to earn:** Spend time in voice channels
- **XP per minute:** 10-15 XP (15 XP when with others)
- **Minimum duration:** 1 minute to earn XP
- **Bonuses:** Being in voice with other members gives extra XP

### ⭐ Role Level
- **How to earn:** Complete daily activities and achievements
- **Activities:**
  - Daily login: 50 XP
  - Work command: Variable XP (based on earnings)
  - Message streaks: 25 XP
  - Voice streaks: 30 XP
  - Helping others: 100 XP
  - Event participation: 200 XP

### 🏆 Overall Level
- **Combined XP:** Sum of all Text, Voice, and Role XP
- **Master progression:** Represents your overall server engagement

## 🎁 Level Rewards

### Text Level Rewards
- **Level 5:** 500 💰 WonderCash
- **Level 10:** 1,000 💰 WonderCash
- **Level 15:** Active Member role
- **Level 20:** 2,000 💰 WonderCash
- **Level 25:** Text Master title
- **Level 30:** 5,000 💰 WonderCash

### Voice Level Rewards
- **Level 5:** 750 💰 WonderCash
- **Level 10:** 1,500 💰 WonderCash
- **Level 15:** Social Member role
- **Level 20:** 3,000 💰 WonderCash
- **Level 25:** Voice Champion title
- **Level 30:** 7,500 💰 WonderCash

### Role Level Rewards
- **Level 5:** 1,000 💰 WonderCash
- **Level 10:** 2,500 💰 WonderCash
- **Level 15:** Helpful Member role
- **Level 20:** 5,000 💰 WonderCash
- **Level 25:** Community Leader title
- **Level 30:** 10,000 💰 WonderCash

### Overall Level Rewards
- **Level 10:** 2,000 💰 WonderCash
- **Level 25:** Veteran role
- **Level 50:** 10,000 💰 WonderCash
- **Level 75:** Server Legend title
- **Level 100:** 50,000 💰 WonderCash

## 💎 XP Multipliers

### Server Boosters
- **1.5x XP** for all activities
- Stacks with other bonuses

### Premium Members
- **1.75x XP** for all activities
- Stacks with other bonuses

## 🎮 Commands

### User Commands
- `/level` - Check your levels and XP progress
- `/level @user` - Check someone else's levels
- `/rank` - View leaderboards by category
- `/rank overall` - Overall leaderboard
- `/rank text` - Text level leaderboard
- `/rank voice` - Voice level leaderboard
- `/rank role` - Role level leaderboard
- `/rewards` - View and claim unclaimed level rewards

### Admin Commands
- `/give-xp @user text 100` - Give XP to a user
- `/reset-level @user` - Reset user's levels
- `/reset-level @user text` - Reset specific level type

## 🛍️ Shop Integration

The leveling system integrates with the Wonder Shop! New level-restricted items include:

### Level-Restricted Items
- **⚡ XP Booster** (Overall Level 5): Double XP for 1 hour
- **🌟 Premium XP Booster** (Overall Level 15): Triple XP for 2 hours  
- **🎤 Voice Magnet** (Voice Level 10): Extra voice XP when others join
- **💬 Chat Streak** (Text Level 8): No text XP cooldown for 30 minutes
- **🏆 Legend Badge** (Overall Level 50): Exclusive legend badge

## 📈 Level Formula

The XP required for each level follows the formula:
```
XP Needed = 100 × Level^1.5
```

Examples:
- Level 1 → 2: 100 XP
- Level 5 → 6: 1,118 XP  
- Level 10 → 11: 3,162 XP
- Level 20 → 21: 8,944 XP

## 🔧 Configuration

Leveling settings can be configured in `config.json`:

```json
{
  "leveling": {
    "enabled": true,
    "xp": {
      "text": {
        "base": 15,
        "bonus": 5,
        "cooldown": 60000,
        "multipliers": {
          "booster": 1.5,
          "premium": 1.75
        }
      }
    }
  }
}
```

## 📊 Database Structure

The system uses several new database tables:
- `user_levels` - Stores XP and level data for each user
- `level_rewards` - Tracks level rewards and claim status
- `voice_sessions` - Records voice activity sessions

## 🚀 Features

- **Real-time level ups** - Instant notifications when you level up
- **Automatic reward claiming** - Rewards are auto-claimed when viewing
- **Voice session tracking** - Accurate voice time and XP tracking
- **Comprehensive leaderboards** - Multiple ranking categories
- **Role integration** - Automatic role assignment for level rewards
- **Shop integration** - Level requirements for special items

## 🎯 Tips for Leveling

1. **Stay active in chat** - Regular messages give steady text XP
2. **Join voice channels** - Voice XP accumulates over time
3. **Complete daily activities** - Don't miss your daily rewards
4. **Boost the server** - Get 1.5x XP multiplier on everything
5. **Purchase XP boosters** - Speed up progression with shop items

## 🔄 Migration

Existing users will automatically get leveling records created when they:
- Send their first message after the update
- Join a voice channel
- Use any bot command

Start your leveling journey today and climb the ranks to become a server legend! 🏆