const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.db = new sqlite3.Database(path.join(__dirname, '..', 'wonder.db'));
        this.init();
    }

    init() {
        // Users table for economy system
        this.db.run(`
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                username TEXT,
                balance INTEGER DEFAULT 0,
                daily_last_claimed TEXT,
                work_last_used TEXT,
                total_earned INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Introduction cards table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS introduction_cards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT UNIQUE,
                name TEXT,
                age INTEGER,
                location TEXT,
                hobbies TEXT,
                favorite_color TEXT,
                bio TEXT,
                image_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Server settings table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS server_settings (
                guild_id TEXT PRIMARY KEY,
                welcome_channel TEXT,
                introduction_channel TEXT,
                welcome_message TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Transaction history
        this.db.run(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                type TEXT,
                amount INTEGER,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // User inventory table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS user_inventory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                item_id TEXT,
                quantity INTEGER DEFAULT 1,
                acquired_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Active effects table for consumables
        this.db.run(`
            CREATE TABLE IF NOT EXISTS active_effects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                effect_type TEXT,
                duration_minutes INTEGER,
                uses_remaining INTEGER DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME
            )
        `);

        // Cooldowns table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS cooldowns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                command_type TEXT,
                last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, command_type)
            )
        `);

        // User profiles table for customization
        this.db.run(`
            CREATE TABLE IF NOT EXISTS user_profiles (
                user_id TEXT PRIMARY KEY,
                custom_title TEXT,
                name_color TEXT,
                card_border TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    // User economy methods
    async getUser(userId) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM users WHERE user_id = ?', [userId], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    }

    async createUser(userId, username) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT OR IGNORE INTO users (user_id, username) VALUES (?, ?)',
                [userId, username],
                function(err) {
                    if (err) reject(err);
                    resolve(this.lastID);
                }
            );
        });
    }

    async updateBalance(userId, amount) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE users SET balance = balance + ? WHERE user_id = ?',
                [amount, userId],
                function(err) {
                    if (err) reject(err);
                    resolve(this.changes);
                }
            );
        });
    }

    async setBalance(userId, amount) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE users SET balance = ? WHERE user_id = ?',
                [amount, userId],
                function(err) {
                    if (err) reject(err);
                    resolve(this.changes);
                }
            );
        });
    }

    async updateDailyClaim(userId) {
        return new Promise((resolve, reject) => {
            const now = new Date().toISOString();
            this.db.run(
                'UPDATE users SET daily_last_claimed = ? WHERE user_id = ?',
                [now, userId],
                function(err) {
                    if (err) reject(err);
                    resolve(this.changes);
                }
            );
        });
    }

    async updateWorkClaim(userId) {
        return new Promise((resolve, reject) => {
            const now = new Date().toISOString();
            this.db.run(
                'UPDATE users SET work_last_used = ? WHERE user_id = ?',
                [now, userId],
                function(err) {
                    if (err) reject(err);
                    resolve(this.changes);
                }
            );
        });
    }

    // Introduction card methods
    async saveIntroCard(data) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT OR REPLACE INTO introduction_cards 
                 (user_id, name, age, location, hobbies, favorite_color, bio) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [data.userId, data.name, data.age, data.location, data.hobbies, data.favoriteColor, data.bio],
                function(err) {
                    if (err) reject(err);
                    resolve(this.lastID);
                }
            );
        });
    }

    async getIntroCard(userId) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM introduction_cards WHERE user_id = ?', [userId], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    }

    // Transaction methods
    async addTransaction(userId, type, amount, description) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)',
                [userId, type, amount, description],
                function(err) {
                    if (err) reject(err);
                    resolve(this.lastID);
                }
            );
        });
    }

    // Server settings methods
    async getServerSettings(guildId) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM server_settings WHERE guild_id = ?', [guildId], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    }

    async updateServerSettings(guildId, settings) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT OR REPLACE INTO server_settings 
                 (guild_id, welcome_channel, introduction_channel, welcome_message) 
                 VALUES (?, ?, ?, ?)`,
                [guildId, settings.welcomeChannel, settings.introductionChannel, settings.welcomeMessage],
                function(err) {
                    if (err) reject(err);
                    resolve(this.lastID);
                }
            );
        });
    }

    // Leaderboard methods
    async getTopUsers(limit = 10) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT user_id, username, balance FROM users ORDER BY balance DESC LIMIT ?',
                [limit],
                (err, rows) => {
                    if (err) reject(err);
                    resolve(rows);
                }
            );
        });
    }

    // Inventory methods
    async addItemToInventory(userId, itemId, quantity = 1) {
        return new Promise((resolve, reject) => {
            // Check if item already exists in inventory
            this.db.get(
                'SELECT * FROM user_inventory WHERE user_id = ? AND item_id = ?',
                [userId, itemId],
                (err, row) => {
                    if (err) reject(err);
                    
                    if (row) {
                        // Update existing quantity
                        this.db.run(
                            'UPDATE user_inventory SET quantity = quantity + ? WHERE user_id = ? AND item_id = ?',
                            [quantity, userId, itemId],
                            function(err) {
                                if (err) reject(err);
                                resolve(this.changes);
                            }
                        );
                    } else {
                        // Add new item
                        this.db.run(
                            'INSERT INTO user_inventory (user_id, item_id, quantity) VALUES (?, ?, ?)',
                            [userId, itemId, quantity],
                            function(err) {
                                if (err) reject(err);
                                resolve(this.lastID);
                            }
                        );
                    }
                }
            );
        });
    }

    async removeItemFromInventory(userId, itemId, quantity = 1) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE user_inventory SET quantity = quantity - ? WHERE user_id = ? AND item_id = ? AND quantity >= ?',
                [quantity, userId, itemId, quantity],
                function(err) {
                    if (err) reject(err);
                    resolve(this.changes);
                }
            );
        });
    }

    async getUserInventory(userId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM user_inventory WHERE user_id = ? AND quantity > 0 ORDER BY acquired_at DESC',
                [userId],
                (err, rows) => {
                    if (err) reject(err);
                    resolve(rows);
                }
            );
        });
    }

    async hasItem(userId, itemId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT quantity FROM user_inventory WHERE user_id = ? AND item_id = ? AND quantity > 0',
                [userId, itemId],
                (err, row) => {
                    if (err) reject(err);
                    resolve(row ? row.quantity : 0);
                }
            );
        });
    }

    // Active effects methods
    async addActiveEffect(userId, effectType, durationMinutes, usesRemaining = null) {
        return new Promise((resolve, reject) => {
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);
            
            this.db.run(
                'INSERT INTO active_effects (user_id, effect_type, duration_minutes, uses_remaining, expires_at) VALUES (?, ?, ?, ?, ?)',
                [userId, effectType, durationMinutes, usesRemaining, expiresAt.toISOString()],
                function(err) {
                    if (err) reject(err);
                    resolve(this.lastID);
                }
            );
        });
    }

    async getActiveEffects(userId) {
        return new Promise((resolve, reject) => {
            const now = new Date().toISOString();
            this.db.all(
                'SELECT * FROM active_effects WHERE user_id = ? AND (expires_at > ? OR uses_remaining > 0)',
                [userId, now],
                (err, rows) => {
                    if (err) reject(err);
                    resolve(rows);
                }
            );
        });
    }

    async hasActiveEffect(userId, effectType) {
        return new Promise((resolve, reject) => {
            const now = new Date().toISOString();
            this.db.get(
                'SELECT * FROM active_effects WHERE user_id = ? AND effect_type = ? AND (expires_at > ? OR uses_remaining > 0)',
                [userId, effectType, now],
                (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                }
            );
        });
    }

    async useEffect(userId, effectType) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE active_effects SET uses_remaining = uses_remaining - 1 WHERE user_id = ? AND effect_type = ? AND uses_remaining > 0',
                [userId, effectType],
                function(err) {
                    if (err) reject(err);
                    resolve(this.changes);
                }
            );
        });
    }

    async removeExpiredEffects() {
        return new Promise((resolve, reject) => {
            const now = new Date().toISOString();
            this.db.run(
                'DELETE FROM active_effects WHERE expires_at <= ? AND (uses_remaining IS NULL OR uses_remaining <= 0)',
                [now],
                function(err) {
                    if (err) reject(err);
                    resolve(this.changes);
                }
            );
        });
    }

    // Cooldown methods
    async setCooldown(userId, commandType) {
        return new Promise((resolve, reject) => {
            const now = new Date().toISOString();
            this.db.run(
                'INSERT OR REPLACE INTO cooldowns (user_id, command_type, last_used) VALUES (?, ?, ?)',
                [userId, commandType, now],
                function(err) {
                    if (err) reject(err);
                    resolve(this.lastID);
                }
            );
        });
    }

    async getCooldown(userId, commandType) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM cooldowns WHERE user_id = ? AND command_type = ?',
                [userId, commandType],
                (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                }
            );
        });
    }

    async checkCooldown(userId, commandType, cooldownMinutes) {
        return new Promise((resolve, reject) => {
            this.getCooldown(userId, commandType).then(cooldown => {
                if (!cooldown) {
                    resolve({ onCooldown: false, timeLeft: 0 });
                    return;
                }

                const lastUsed = new Date(cooldown.last_used);
                const now = new Date();
                const timeDiff = now - lastUsed;
                const minutesPassed = Math.floor(timeDiff / (1000 * 60));

                if (minutesPassed >= cooldownMinutes) {
                    resolve({ onCooldown: false, timeLeft: 0 });
                } else {
                    const timeLeft = cooldownMinutes - minutesPassed;
                    resolve({ onCooldown: true, timeLeft: timeLeft });
                }
            }).catch(reject);
        });
    }

    // User profile methods
    async getUserProfile(userId) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM user_profiles WHERE user_id = ?', [userId], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    }

    async updateUserProfile(userId, profileData) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT OR REPLACE INTO user_profiles (user_id, custom_title, name_color, card_border) VALUES (?, ?, ?, ?)',
                [userId, profileData.customTitle, profileData.nameColor, profileData.cardBorder],
                function(err) {
                    if (err) reject(err);
                    resolve(this.lastID);
                }
            );
        });
    }
}

module.exports = new Database();