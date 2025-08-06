# 👑 Y2K Kingdom Leveling System

Welcome to the **Y2K Kingdom** - where cyber meets royalty in a stunning aesthetic experience! 

The Y2K Kingdom Bot features a comprehensive multi-tiered leveling system that rewards user activity across different categories with a beautiful, minimalist yet user-friendly design.

## 🔮 **Y2K Kingdom Aesthetic Features**
- **Cyber-Royal Color Palette:** Pink, purple, cyan, and gold
- **Minimalist UI:** Clean, beautiful embeds with strategic emoji usage
- **Royal Status System:** Kingdom citizenship tiers and legendary status
- **Progressive Visual Feedback:** Level badges, progress bars, and status indicators
- **User-Friendly Experience:** Intuitive commands and clear information hierarchy

## 🚨 IMPORTANT: Level Cap
**All level types are capped at Level 50!** Once you reach the maximum level, you become a true **KINGDOM LEGEND**! 👑

## 📊 Kingdom Level Types

### 💬 Text Level
- **How to earn:** Send messages in chat channels
- **XP per message:** 15-25 XP (based on message length)
- **Cooldown:** 1 minute between XP gains
- **Bonuses:** Longer messages (>50 characters) give bonus XP
- **Max Level:** 50
- **Royal Status:** Text mastery and communication excellence

### 🎤 Voice Level  
- **How to earn:** Spend time in voice channels
- **XP per minute:** 10-15 XP (15 XP when with others)
- **Minimum duration:** 1 minute to earn XP
- **Bonuses:** Being in voice with other members gives extra XP
- **⚠️ IMPORTANT:** You must be unmuted (both server and self) to earn voice XP!
- **Max Level:** 50
- **Royal Status:** Social engagement and community presence

### ⭐ Role Level
- **How to earn:** Complete daily activities and achievements
- **Activities:**
  - Daily login: 50 XP
  - Work command: Variable XP (based on earnings)
  - Message streaks: 25 XP
  - Voice streaks: 30 XP
  - Helping others: 100 XP
  - Event participation: 200 XP
- **Max Level:** 50
- **Royal Status:** Kingdom contribution and civic duty

### 🏰 Kingdom Level (Overall)
- **Combined XP:** Sum of all Text, Voice, and Role XP
- **Master progression:** Represents your overall server engagement
- **Max Level:** 50
- **Royal Status:** Ultimate kingdom citizenship and legendary status

## 🎁 Royal Rewards (Updated for Level 50 Cap)

### Fixed CyberCoin & Title Rewards
These rewards are automatically given and cannot be changed:

### Text Level Rewards
- **Level 5:** 500 💎 CyberCoins
- **Level 10:** 1,000 💎 CyberCoins
- **Level 20:** 2,000 💎 CyberCoins
- **Level 25:** Text Master title
- **Level 30:** 5,000 💎 CyberCoins
- **Level 35:** 7,500 💎 CyberCoins
- **Level 40:** 10,000 💎 CyberCoins
- **Level 45:** 15,000 💎 CyberCoins
- **Level 50:** 👑 25,000 💎 CyberCoins - KINGDOM LEGEND STATUS!

### Voice Level Rewards
- **Level 5:** 750 💎 CyberCoins
- **Level 10:** 1,500 💎 CyberCoins
- **Level 20:** 3,000 💎 CyberCoins
- **Level 25:** Voice Champion title
- **Level 30:** 7,500 💎 CyberCoins
- **Level 35:** 10,000 💎 CyberCoins
- **Level 40:** 15,000 💎 CyberCoins
- **Level 45:** 20,000 💎 CyberCoins
- **Level 50:** 👑 35,000 💎 CyberCoins - KINGDOM LEGEND STATUS!

### Role Level Rewards
- **Level 5:** 1,000 💎 CyberCoins
- **Level 10:** 2,500 💎 CyberCoins
- **Level 20:** 5,000 💎 CyberCoins
- **Level 25:** Community Leader title
- **Level 30:** 10,000 💎 CyberCoins
- **Level 35:** 15,000 💎 CyberCoins
- **Level 40:** 20,000 💎 CyberCoins
- **Level 45:** 30,000 💎 CyberCoins
- **Level 50:** 👑 50,000 💎 CyberCoins - KINGDOM LEGEND STATUS!

### Kingdom Level Rewards (Overall)
- **Level 10:** 2,000 💎 CyberCoins
- **Level 30:** 10,000 💎 CyberCoins
- **Level 35:** 15,000 💎 CyberCoins
- **Level 40:** 25,000 💎 CyberCoins
- **Level 45:** Server Grandmaster title
- **Level 50:** 👑 100,000 💎 CyberCoins - ULTIMATE KINGDOM LEGEND STATUS!

### 🎭 Configurable Role Rewards
**NEW FEATURE:** Admins can now set custom role rewards for any level!

**How it works:**
- Admins can assign Discord roles as rewards for reaching specific levels
- Completely customizable - set any role for any level (1-50)
- Works for all level types (Text, Voice, Role, Overall)
- Automatic role assignment when users reach the configured level

**Admin Commands:**
- `/level-role set text 15 @Active Member` - Set role reward
- `/level-role remove voice 20` - Remove role reward  
- `/level-role list` - View all configured role rewards
- `/level-role list text` - View role rewards for specific type

**Examples:**
- Text Level 15: @Active Chatter role
- Voice Level 20: @Social Butterfly role  
- Role Level 25: @Helper role
- Overall Level 30: @Veteran role

## 🎮 Commands

### User Commands
- `/level` - Check your levels and XP progress (now shows upcoming role rewards!)
- `/level @user` - Check someone else's levels
- `/rank` - View leaderboards by category
- `/rewards` - View and claim unclaimed level rewards

### Admin Commands
- `/give-xp @user text 100` - Give XP to a user
- `/reset-level @user` - Reset user's levels
- `/level-role set <type> <level> @role` - **NEW:** Set role reward for level
- `/level-role remove <type> <level>` - **NEW:** Remove role reward 
- `/level-role list [type]` - **NEW:** List all configured role rewards

## 🔧 Setting Up Role Rewards

### Step-by-Step Guide for Admins:

1. **Create or choose roles** you want to use as rewards
2. **Use the `/level-role set` command:**
   ```
   /level-role set text 15 @Active Member
   /level-role set voice 20 @Social Butterfly  
   /level-role set overall 25 @Veteran
   ```
3. **View your configuration:**
   ```
   /level-role list
   ```
4. **Modify if needed:**
   ```
   /level-role remove text 15
   /level-role set text 20 @Super Active
   ```

### Best Practices:
- **Start with common levels** like 10, 15, 20, 25, etc.
- **Use meaningful role names** that reflect achievement
- **Don't overwhelm** - 3-5 role rewards per type is usually enough
- **Consider role hierarchy** - higher levels should get better roles
- **Test with yourself** using `/give-xp` to verify it works

### Database Storage:
- All role rewards are stored in the `level_role_config` table
- Includes: level type, level number, role ID, role name, creator, timestamp
- Persistent across bot restarts
- Unique constraint prevents duplicate rewards for same level

## 🎯 Tips for Reaching Max Level

1. **Stay consistently active** - Regular participation is key
2. **Keep voice unmuted** - Muted time doesn't count for voice XP
3. **Complete daily activities** - Role XP adds up quickly
4. **Use XP boosters wisely** - Save them for grinding sessions
5. **Participate in events** - Maximum role XP opportunities
6. **Check upcoming role rewards** - See what roles you can earn next!