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
}

module.exports = new Database();