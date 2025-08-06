# 🎯 Leveling System Documentation

## 📋 Table of Contents
- [System Overview](#-system-overview)
- [XP Categories](#-xp-categories)
- [Level Progression](#-level-progression)
- [Reward System](#-reward-system)
- [Admin Configuration](#-admin-configuration)
- [Commands Reference](#-commands-reference)
- [Technical Implementation](#-technical-implementation)

## 🎯 System Overview

The Luxury Kingdom Bot features a comprehensive 4-category leveling system designed to reward user engagement across multiple activities. Each category has independent progression with unique rewards and benefits.

### Core Features
- **4 Independent Categories**: Text, Voice, Role, Overall
- **Maximum Level**: 50 in all categories
- **Progressive Rewards**: WonderCoins and role rewards at milestones
- **Role-Based Multipliers**: Premium and Booster benefits
- **Anti-Spam Protection**: Cooldowns prevent exploitation
- **Persistent Progress**: All data saved in database

### Category Breakdown
| Category | Max Level | XP Source | Primary Focus |
|----------|-----------|-----------|---------------|
| **Text** | 50 | Chat messages | Active conversation |
| **Voice** | 50 | Voice channel time | Voice participation |
| **Role** | 50 | Special activities | Community engagement |
| **Overall** | 50 | Combined progress | Total contribution |

## 📊 XP Categories

### 💬 Text XP System
**XP Generation:**
- **Base XP**: 15-25 XP per message
- **Cooldown**: 60 seconds between XP grants
- **Maximum**: 25 XP per message
- **Anti-Spam**: Prevents rapid-fire messaging

**Calculation Formula:**
```javascript
baseXP = random(15, 25)
bonusXP = random(0, 5)
finalXP = (baseXP + bonusXP) * multiplier
```

**Multipliers:**
- **Regular Users**: 1.0x
- **Server Boosters**: 1.5x
- **Premium Members**: 1.75x

**Requirements:**
- Message must not start with bot prefix
- User must not be a bot
- Must respect 60-second cooldown

### 🎤 Voice XP System
**XP Generation:**
- **Base XP**: 10 XP per minute
- **Bonus XP**: Up to 5 XP bonus per minute
- **Minimum Duration**: 60 seconds (1 minute)
- **Activity Requirement**: Must be unmuted

**Calculation Formula:**
```javascript
minutesInVoice = sessionDuration / 60000
baseXP = minutesInVoice * 10
bonusXP = minutesInVoice * random(0, 5)
finalXP = (baseXP + bonusXP) * multiplier
```

**Multipliers:**
- **Regular Users**: 1.0x
- **Server Boosters**: 1.5x
- **Premium Members**: 1.75x

**Session Tracking:**
- Auto-start when joining voice channel
- Auto-end when leaving or going muted
- XP awarded when session ends
- Minimum 1-minute sessions only

### 🏆 Role XP System
**XP Sources:**
| Activity | XP Amount | Description |
|----------|-----------|-------------|
| Daily Login | 50 XP | First command of the day |
| Message Streak | 25 XP | Consistent daily messaging |
| Voice Streak | 30 XP | Regular voice participation |
| Helping Others | 100 XP | Community assistance |
| Event Participation | 200 XP | Special events |

**Multipliers:**
- **Regular Users**: 1.0x
- **Server Boosters**: 1.25x
- **Premium Members**: 1.5x

**Streak System:**
- **Message Streak**: Daily text activity
- **Voice Streak**: Daily voice participation
- **Reset**: Streaks reset after 48 hours of inactivity

### 🌟 Overall Level System
**Calculation Method:**
```javascript
totalXP = textXP + voiceXP + roleXP
overallLevel = calculateLevelFromXP(totalXP)
```

**Purpose:**
- Combined measure of all activity
- Used for role reward eligibility
- Server status indicator
- Leaderboard rankings

## 📈 Level Progression

### XP Requirements Formula
```javascript
function getXPForLevel(level) {
    if (level <= 1) return 0;
    return Math.floor(100 * Math.pow(1.2, level - 1));
}
```

### Level XP Table
| Level | XP Required | Cumulative XP | WonderCoins Reward |
|-------|-------------|---------------|-------------------|
| 1 | 0 | 0 | - |
| 5 | 244 | 672 | 500 |
| 10 | 619 | 2,436 | 1,000 |
| 15 | 1,566 | 7,499 | 1,500 |
| 20 | 3,960 | 22,046 | 2,000 |
| 25 | 10,017 | 63,205 | 3,000 |
| 30 | 25,340 | 174,546 | 5,000 |
| 35 | 64,119 | 474,367 | 7,500 |
| 40 | 162,185 | 1,263,531 | 10,000 |
| 45 | 410,170 | 3,318,052 | 15,000 |
| 50 | 1,037,629 | 8,555,681 | 25,000 |

### Progression Milestones
**Early Game (Levels 1-10):**
- Focus: Learning bot features
- XP Required: Low (100-619 per level)
- Rewards: Basic WonderCoins

**Mid Game (Levels 11-30):**
- Focus: Regular participation
- XP Required: Moderate (619-25,340 per level)
- Rewards: Increased coin rewards

**End Game (Levels 31-50):**
- Focus: Dedicated community members
- XP Required: High (25,340-1,037,629 per level)
- Rewards: Premium coins and exclusive roles

## 💰 Reward System

### WonderCoins Rewards

#### Regular User Rewards
| Level | Text/Voice/Role XP | Overall XP | Notes |
|-------|-------------------|------------|--------|
| 5 | 500 💰 | 750 💰 | Early milestone |
| 10 | 1,000 💰 | 1,500 💰 | Engagement reward |
| 15 | 1,500 💰 | 2,000 💰 | Consistency bonus |
| 20 | 2,000 💰 | 3,000 💰 | Dedication reward |
| 25 | 3,000 💰 | 4,000 💰 | Commitment bonus |
| 30 | 5,000 💰 | 7,500 💰 | Achievement reward |
| 35 | 7,500 💰 | 10,000 💰 | Excellence bonus |
| 40 | 10,000 💰 | 15,000 💰 | Elite status |
| 45 | 15,000 💰 | 20,000 💰 | Legendary status |
| 50 | 👑 25,000 💰 | 👑 35,000 💰 | **KINGDOM LEGEND** |

#### Server Booster Rewards (+50% Bonus)
| Level | Text/Voice/Role XP | Overall XP | Notes |
|-------|-------------------|------------|--------|
| 5 | 750 💰 | 1,125 💰 | Booster appreciation |
| 10 | 1,500 💰 | 2,250 💰 | Enhanced rewards |
| 20 | 3,000 💰 | 4,500 💰 | Premium benefits |
| 30 | 7,500 💰 | 11,250 💰 | Exclusive tier |
| 40 | 15,000 💰 | 22,500 💰 | VIP recognition |
| 50 | 👑 37,500 💰 | 👑 52,500 💰 | **ROYAL BOOSTER** |

#### Premium Member Rewards (+100% Bonus)
| Level | Text/Voice/Role XP | Overall XP | Notes |
|-------|-------------------|------------|--------|
| 5 | 1,000 💰 | 1,500 💰 | Premium perks |
| 10 | 2,000 💰 | 3,000 💰 | Enhanced progression |
| 20 | 4,000 💰 | 6,000 💰 | Accelerated rewards |
| 30 | 10,000 💰 | 15,000 💰 | Premium excellence |
| 40 | 20,000 💰 | 30,000 💰 | Ultimate recognition |
| 50 | 👑 50,000 💰 | 👑 70,000 💰 | **ULTIMATE LEGEND** |

#### Luxury Elite Rewards (+150% Bonus)
| Level | Text/Voice/Role XP | Overall XP | Notes |
|-------|-------------------|------------|--------|
| 10 | 2,500 💰 | 3,750 💰 | Elite beginning |
| 20 | 5,000 💰 | 7,500 💰 | Elite progression |
| 30 | 12,500 💰 | 18,750 💰 | Elite mastery |
| 40 | 25,000 💰 | 37,500 💰 | Elite excellence |
| 50 | 👑 62,500 💰 | 👑 87,500 💰 | **LUXURY ELITE** |

### Role Rewards System

#### Automatic Role Assignment
Roles are automatically assigned based on **Overall Level** milestones:

| Level Requirement | Role Name | Description |
|------------------|-----------|-------------|
| 5 | Kingdom Citizen | Basic membership |
| 10 | Court Member | Active participant |
| 15 | Noble | Regular contributor |
| 20 | Royal Guard | Dedicated member |
| 25 | Court Aristocrat | Elite contributor |
| 30 | Royal Advisor | Highly valued member |
| 35 | Duke/Duchess | Distinguished member |
| 40 | Royal Nobility | Premium status |
| 45 | Kingdom Elite | Legendary status |
| 50 | Kingdom Legend | Ultimate achievement |

#### Role Benefit Stacking
- **Base Benefits**: Access to exclusive channels
- **Economy Bonuses**: Enhanced daily/work rewards
- **Gaming Perks**: Reduced cooldowns
- **Drop Advantages**: Bonus collection multipliers
- **Social Status**: Visual recognition in commands

## ⚙️ Admin Configuration

### Role Reward Management

#### Add Role Reward
```
/level-role add type:overall level:25 role:@Court Aristocrat
```

#### Remove Role Reward
```
/level-role remove type:overall level:25
```

#### List Role Rewards
```
/level-role list type:overall
```

### XP Management

#### Give XP to User
```
/give-xp user:@member type:text amount:1000
```

#### Reset User Levels
```
/reset-level user:@member type:text
```

#### View User Progress
```
/level user:@member
```

### Bulk Operations

#### Reset All Text Levels (Admin Only)
```sql
-- Database query for complete reset
UPDATE user_levels SET text_level = 1, text_xp = 0;
```

#### Backup Level Data
```sql
-- Create backup table
CREATE TABLE level_backup AS SELECT * FROM user_levels;
```

## 📚 Commands Reference

### User Commands
| Command | Description | Usage | Cooldown |
|---------|-------------|-------|----------|
| `/level` | Check your levels | `/level @user` | None |
| `/rank` | View rankings | `/rank type:overall` | None |
| `/rewards` | View level rewards | `/rewards` | None |

### Admin Commands
| Command | Description | Usage | Permission |
|---------|-------------|-------|-----------|
| `/give-xp` | Grant XP to user | `/give-xp @user type:text amount:100` | Administrator |
| `/reset-level` | Reset user level | `/reset-level @user type:text` | Administrator |
| `/level-role` | Manage role rewards | `/level-role add type:text level:10 role:@Member` | Administrator |

### Leaderboard Commands
| Command | Description | Usage | Notes |
|---------|-------------|-------|--------|
| `/rank text` | Text level rankings | `/rank type:text` | Top 15 users |
| `/rank voice` | Voice level rankings | `/rank type:voice` | Top 15 users |
| `/rank role` | Role level rankings | `/rank type:role` | Top 15 users |
| `/rank overall` | Overall rankings | `/rank type:overall` | Combined progress |

## 🔧 Technical Implementation

### Database Schema
```sql
CREATE TABLE user_levels (
    user_id TEXT PRIMARY KEY,
    text_level INTEGER DEFAULT 1,
    text_xp INTEGER DEFAULT 0,
    voice_level INTEGER DEFAULT 1,
    voice_xp INTEGER DEFAULT 0,
    role_level INTEGER DEFAULT 1,
    role_xp INTEGER DEFAULT 0,
    overall_level INTEGER DEFAULT 1,
    total_xp INTEGER DEFAULT 0,
    last_text_xp DATETIME,
    voice_session_start DATETIME,
    last_daily_login DATETIME,
    message_streak INTEGER DEFAULT 0,
    voice_streak INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### XP Calculation Functions

#### Level from XP
```javascript
function getLevelFromXP(xp) {
    let level = 1;
    let requiredXP = 0;
    
    while (requiredXP <= xp && level < 50) {
        level++;
        requiredXP += getXPForLevel(level);
    }
    
    return Math.min(level - 1, 50);
}
```

#### XP for Next Level
```javascript
function getXPForNextLevel(currentLevel, currentXP) {
    if (currentLevel >= 50) return 0;
    
    const totalXPForNext = getTotalXPForLevel(currentLevel + 1);
    return Math.max(0, totalXPForNext - currentXP);
}
```

#### Progress Percentage
```javascript
function getLevelProgress(level, xp) {
    if (level >= 50) return 100;
    
    const currentLevelXP = getTotalXPForLevel(level);
    const nextLevelXP = getTotalXPForLevel(level + 1);
    const levelXP = nextLevelXP - currentLevelXP;
    const progressXP = xp - currentLevelXP;
    
    return Math.min(100, Math.max(0, (progressXP / levelXP) * 100));
}
```

### Event Handlers

#### Text XP Handler
```javascript
async addTextXP(userId, message) {
    // Check cooldown
    if (!this.canGainTextXP(userId)) return;
    
    // Calculate XP
    const baseXP = Math.floor(Math.random() * 11) + 15; // 15-25
    const bonusXP = Math.floor(Math.random() * 6); // 0-5
    const multiplier = this.getUserMultiplier(userId);
    const finalXP = Math.floor((baseXP + bonusXP) * multiplier);
    
    // Add XP and check for level up
    await this.addXP(userId, 'text', finalXP);
    await this.checkLevelUp(userId, 'text');
}
```

#### Voice XP Handler
```javascript
async updateVoiceXP(userId) {
    const session = this.getVoiceSession(userId);
    if (!session || !session.isUnmuted) return;
    
    const sessionTime = Date.now() - session.startTime;
    const minutes = Math.floor(sessionTime / 60000);
    
    if (minutes >= 1) {
        const baseXP = minutes * 10;
        const bonusXP = minutes * Math.floor(Math.random() * 6);
        const multiplier = this.getUserMultiplier(userId);
        const finalXP = Math.floor((baseXP + bonusXP) * multiplier);
        
        await this.addXP(userId, 'voice', finalXP);
        await this.checkLevelUp(userId, 'voice');
    }
}
```

### Level Up Processing
```javascript
async checkLevelUp(userId, type) {
    const userData = await database.getUserLevels(userId);
    const currentLevel = userData[`${type}_level`];
    const currentXP = userData[`${type}_xp`];
    const newLevel = this.getLevelFromXP(currentXP);
    
    if (newLevel > currentLevel) {
        // Update level
        await database.updateUserLevel(userId, type, newLevel);
        
        // Check for rewards
        await this.processLevelRewards(userId, type, newLevel);
        
        // Announce level up
        await this.announceLevelUp(userId, type, newLevel);
    }
}
```

### Performance Optimizations

#### Batch Updates
```javascript
// Update multiple users at once
async batchUpdateXP(updates) {
    const query = `
        UPDATE user_levels 
        SET text_xp = text_xp + ?, last_text_xp = CURRENT_TIMESTAMP 
        WHERE user_id = ?
    `;
    
    await database.batchExecute(query, updates);
}
```

#### Caching Strategy
```javascript
// Cache frequently accessed data
class LevelCache {
    constructor() {
        this.userLevels = new Map();
        this.roleRewards = new Map();
        this.refreshInterval = 5 * 60 * 1000; // 5 minutes
    }
    
    async getUserLevels(userId) {
        if (!this.userLevels.has(userId)) {
            const levels = await database.getUserLevels(userId);
            this.userLevels.set(userId, levels);
        }
        return this.userLevels.get(userId);
    }
}
```

## 🎯 Best Practices

### For Users
1. **Consistent Activity**: Regular participation yields better rewards
2. **Voice Participation**: Stay unmuted for voice XP
3. **Community Engagement**: Help others for role XP bonuses
4. **Premium Benefits**: Consider premium membership for 75% bonus

### For Admins
1. **Role Configuration**: Set up role rewards early
2. **Monitor Progress**: Use leaderboards to track engagement
3. **Balance Rewards**: Adjust XP rates based on server activity
4. **Regular Maintenance**: Backup level data periodically

### Performance Tips
1. **Database Maintenance**: Regular cleanup of old sessions
2. **Cache Management**: Implement caching for high-traffic servers
3. **Rate Limiting**: Monitor XP generation rates
4. **Error Handling**: Graceful degradation for database issues

---

**This leveling system promotes sustained engagement while rewarding dedication and community participation across all aspects of Discord server life.**