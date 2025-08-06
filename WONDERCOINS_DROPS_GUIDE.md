# 🪙 WonderCoins Drop System Guide

## Overview
The WonderCoins Drop System adalah fitur interaktif yang secara otomatis men-drop WonderCoins di channel yang dikonfigurasi oleh admin dengan timing random dan mechanics collection yang seru!

## 🎯 Features

### ⏰ Random Timing System
- **Interval:** 30 menit hingga 3 jam antara setiap drop
- **Tidak predictable:** Timing benar-benar random untuk menciptakan excitement
- **Per-server:** Setiap server memiliki jadwal drop terpisah

### 💰 Drop Amount & Rarity System
- **Common Drops:** 10-500 WonderCoins (Base chance)
- **Rare Drops:** 3x multiplier (10% chance) ✨
- **Epic Drops:** 5x multiplier (5% chance) 🌟
- **Legendary Drops:** 10x multiplier (1% chance) 👑

### 🎮 Fun Collection Mechanics
Setiap drop memiliki 3 cara collection yang berbeda:

#### 💰 Standard Collection
- Klik "Grab Coins!" untuk mengambil coins normal
- Jumlah sesuai dengan drop amount

#### ⚡ Quick Grab
- Sistem "First come, first served"
- **3 orang pertama** mendapat **2x coins!**
- Cocok untuk yang punya reflexes cepat

#### 🍀 Lucky Grab
- Ada **30% chance** untuk mendapat **1.5x coins**
- Gambling-style collection untuk thrill seekers
- Risk vs reward mechanics

### 🏆 Bonus Multipliers
- **Premium Role:** +50% coins dari semua drops
- **Booster Role:** +25% coins dari semua drops
- Stack dengan collection multipliers!

## 🔧 Admin Commands

### Setup Drop Channels
```
/drops setup channel:#your-channel
```
Menambahkan channel untuk menerima WonderCoins drops.

### Remove Drop Channels  
```
/drops remove channel:#your-channel
```
Menghapus channel dari drop system.

### List Active Channels
```
/drops list
```
Melihat semua channel yang aktif untuk drops.

### Manual Drop Trigger
```
/drops trigger channel:#channel [amount:100] [rarity:rare]
```
Trigger drop manual (untuk events atau testing).

### Server Statistics
```
/drops stats
```
Melihat statistik lengkap drops di server:
- Total drops & coins distributed
- Rarity breakdown
- Top collectors leaderboard

## 👤 User Commands

### Personal Statistics
```
/drops mystats
```
Melihat statistik personal:
- Total coins collected
- Drop count per rarity
- Best single drop
- Collection performance

## 🎨 Drop Embed Examples

### Common Drop
```
💰 WonderCoins Drop!
💎 **150** 💰 WonderCoins have appeared!

🎯 Collection Method: Standard Collection
📝 Click the button to collect!

⏰ Time Limit: 60 seconds
🎭 Rarity: COMMON
```

### Legendary Drop
```
👑 LEGENDARY WonderCoins Drop!
💎 **2,500** 👑 WonderCoins have appeared!

🎯 Collection Method: Quick Reflexes  
📝 First 3 collectors get double coins!

⏰ Time Limit: 60 seconds
🎭 Rarity: LEGENDARY

[GIF Animation untuk legendary drops]
```

## 📊 Database Structure

### Drop Channels Table
- `guild_id` - Server ID
- `channel_id` - Channel ID untuk drops
- `created_by` - Admin yang setup
- `created_at` - Timestamp

### Drop Statistics Table
- `guild_id` - Server ID
- `user_id` - User yang collect
- `amount` - Jumlah coins collected
- `rarity` - Rarity drop (common/rare/epic/legendary)
- `collection_type` - Method collection (collect/quick/lucky)
- `drop_timestamp` - Kapan drop terjadi

### User Drop Stats Table
- `user_id` - User ID
- `total_collected` - Total coins dari drops
- `total_drops` - Jumlah drops participated
- `common_drops`, `rare_drops`, `epic_drops`, `legendary_drops` - Count per rarity
- `last_drop` - Last participation
- `best_drop` - Highest single collection

## 🎯 Fun Mechanics Details

### Collection Strategies
1. **Speed Runners:** Focus pada quick grab untuk 2x multiplier
2. **Gamblers:** Selalu pilih lucky grab untuk chance bonus
3. **Safe Players:** Standard collection tanpa risk

### Competition Elements
- **Server leaderboards** untuk top collectors
- **Rarity hunting** untuk complete collection
- **Speed competitions** untuk quick grab bonuses

### Role-Based Benefits
- Premium users mendapat substantial bonus di semua drops
- Booster rewards untuk server supporters
- Mendorong role purchases dan server engagement

## 🚀 Usage Examples

### Scenario 1: Regular Drop
```
[10:30 AM] WonderBot
💰 WonderCoins Drop!
💎 **75** 💰 WonderCoins have appeared!

🎯 Collection Method: Lucky Draw
📝 Random chance for bonus coins!

[User clicks 🍀 Lucky Grab!]

✅ You collected 113 WonderCoins! (Lucky bonus activated!)
```

### Scenario 2: Epic Quick Drop
```
[2:15 PM] WonderBot  
🌟 Epic WonderCoins Drop!
💎 **850** 🌟 WonderCoins have appeared!

🎯 Collection Method: Quick Reflexes
📝 First 3 collectors get double coins!

[User clicks ⚡ Quick Grab! as 2nd person]

✅ You collected 1,700 WonderCoins! (Epic + Quick bonus!)
```

### Scenario 3: Legendary Drop Chaos
```
[7:45 PM] WonderBot
👑 LEGENDARY WonderCoins Drop!
💎 **3,200** 👑 WonderCoins have appeared!

[Entire server goes crazy clicking buttons]
[Multiple users get various amounts based on timing and luck]
```

## 💡 Tips untuk Users

1. **Stay Active:** Drops bisa muncul kapan saja selama 30 menit - 3 jam
2. **Quick Reflexes:** Untuk quick grab bonus, speed is everything
3. **Lucky Strategy:** Lucky grab bagus untuk consistent extra income
4. **Role Investment:** Premium/Booster roles significantly boost earnings
5. **Statistics Tracking:** Monitor `/drops mystats` untuk track progress

## 💡 Tips untuk Admins

1. **Channel Selection:** Pilih channel yang active tapi tidak spam
2. **Multiple Channels:** Setup beberapa channel untuk spread excitement
3. **Manual Drops:** Use `/drops trigger` untuk special events
4. **Monitor Stats:** Check `/drops stats` untuk server engagement
5. **Balance:** Monitor apakah drop rates sesuai dengan server economy

## 🔧 Technical Notes

- Drop timing menggunakan `setTimeout` dengan random intervals
- Active drops stored di memory untuk performance
- Database tracking untuk persistent statistics
- Automatic cleanup expired drops
- Graceful handling untuk deleted channels

## 🎊 Special Events Ideas

### Drop Events yang Bisa Dilakukan Admin:
1. **Happy Hour:** Manual trigger beberapa legendary drops
2. **Rarity Challenge:** Track siapa yang collect semua rarity types
3. **Speed Events:** Announce quick drop coming, create excitement
4. **Lucky Friday:** Semua drops hari Jumat jadi lucky type
5. **Server Milestone:** Big legendary drop celebration

---

*Sistem ini dirancang untuk maksimum engagement dan fun while maintaining balanced economy. Setiap collection method memberikan different experience dan strategy untuk users.*