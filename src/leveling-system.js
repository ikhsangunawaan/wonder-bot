const { EmbedBuilder } = require('discord.js');
const database = require('./database');
const config = require('../config.json');

class LevelingSystem {
    constructor(client) {
        this.client = client;
        this.voiceSessions = new Map(); // Track active voice sessions
        this.xpCooldowns = new Map(); // Text XP cooldowns
        
        // XP Configuration
        this.xpConfig = {
            text: {
                base: 15,
                bonus: 5,
                cooldown: 60000, // 1 minute cooldown between XP gains
                maxPerMessage: 25
            },
            voice: {
                base: 10, // XP per minute in voice
                bonus: 5, // Bonus for being in voice with others
                minDuration: 60000 // Minimum 1 minute to earn XP
            },
            role: {
                dailyLogin: 50,
                messageStreak: 25,
                voiceStreak: 30,
                helpingOthers: 100,
                eventParticipation: 200
            }
        };

        // Level calculation formula: XP needed = 100 * level^1.5
        this.levelFormula = {
            calculateXPNeeded: (level) => Math.floor(100 * Math.pow(level, 1.5)),
            calculateLevel: (xp) => Math.floor(Math.pow(xp / 100, 1 / 1.5))
        };

        // Level rewards configuration
        this.levelRewards = {
            text: {
                5: { type: 'currency', amount: 500, message: 'Chatty Beginner Bonus!' },
                10: { type: 'currency', amount: 1000, message: 'Active Chatter Reward!' },
                15: { type: 'role', roleId: process.env.ACTIVE_ROLE_ID, message: 'You earned the Active Member role!' },
                20: { type: 'currency', amount: 2000, message: 'Text Master Bonus!' },
                25: { type: 'title', title: 'Text Master', message: 'You can now use the Text Master title!' },
                30: { type: 'currency', amount: 5000, message: 'Legendary Chatter Reward!' }
            },
            voice: {
                5: { type: 'currency', amount: 750, message: 'Voice Newbie Bonus!' },
                10: { type: 'currency', amount: 1500, message: 'Social Speaker Reward!' },
                15: { type: 'role', roleId: process.env.SOCIAL_ROLE_ID, message: 'You earned the Social Member role!' },
                20: { type: 'currency', amount: 3000, message: 'Voice Champion Bonus!' },
                25: { type: 'title', title: 'Voice Champion', message: 'You can now use the Voice Champion title!' },
                30: { type: 'currency', amount: 7500, message: 'Voice Legend Reward!' }
            },
            role: {
                5: { type: 'currency', amount: 1000, message: 'Community Helper Bonus!' },
                10: { type: 'currency', amount: 2500, message: 'Server Contributor Reward!' },
                15: { type: 'role', roleId: process.env.HELPFUL_ROLE_ID, message: 'You earned the Helpful Member role!' },
                20: { type: 'currency', amount: 5000, message: 'Community Leader Bonus!' },
                25: { type: 'title', title: 'Community Leader', message: 'You can now use the Community Leader title!' },
                30: { type: 'currency', amount: 10000, message: 'Server Legend Reward!' }
            },
            overall: {
                10: { type: 'currency', amount: 2000, message: 'Rising Star Bonus!' },
                25: { type: 'role', roleId: process.env.VETERAN_ROLE_ID, message: 'You earned the Veteran role!' },
                50: { type: 'currency', amount: 10000, message: 'Server Veteran Reward!' },
                75: { type: 'title', title: 'Server Legend', message: 'You can now use the Server Legend title!' },
                100: { type: 'currency', amount: 50000, message: 'Ultimate Legend Achievement!' }
            }
        };
    }

    // Calculate XP needed for next level
    getXPForLevel(level) {
        return this.levelFormula.calculateXPNeeded(level);
    }

    // Calculate level from XP
    getLevelFromXP(xp) {
        return this.levelFormula.calculateLevel(xp) + 1; // +1 because we start at level 1
    }

    // Calculate XP progress to next level
    getXPProgress(currentXP, currentLevel) {
        const currentLevelXP = this.getXPForLevel(currentLevel - 1);
        const nextLevelXP = this.getXPForLevel(currentLevel);
        const progressXP = currentXP - currentLevelXP;
        const neededXP = nextLevelXP - currentLevelXP;
        
        return {
            current: progressXP,
            needed: neededXP,
            percentage: Math.floor((progressXP / neededXP) * 100)
        };
    }

    // Add text XP when user sends a message
    async addTextXP(userId, message) {
        const now = Date.now();
        const cooldownKey = `${userId}_text`;
        
        // Check cooldown
        if (this.xpCooldowns.has(cooldownKey)) {
            const lastXP = this.xpCooldowns.get(cooldownKey);
            if (now - lastXP < this.xpConfig.text.cooldown) {
                return null; // Still on cooldown
            }
        }

        // Calculate XP based on message length and quality
        let xpGain = this.xpConfig.text.base;
        
        // Bonus for longer messages (up to limit)
        if (message.content.length > 50) {
            xpGain += Math.min(this.xpConfig.text.bonus, this.xpConfig.text.maxPerMessage - this.xpConfig.text.base);
        }

        // Apply multipliers from roles/boosts
        const member = message.guild?.members.cache.get(userId);
        if (member) {
            const multiplier = this.getXPMultiplier(member);
            xpGain = Math.floor(xpGain * multiplier);
        }

        // Set cooldown
        this.xpCooldowns.set(cooldownKey, now);

        // Add XP to database
        await database.getUserLevels(userId); // Ensure user exists
        await database.addXP(userId, 'text', xpGain);

        // Check for level up
        const levelData = await database.getUserLevels(userId);
        const newLevel = this.getLevelFromXP(levelData.text_xp);
        
        if (newLevel > levelData.text_level) {
            await this.handleLevelUp(userId, 'text', levelData.text_level, newLevel, message.channel);
        }

        return { xpGain, newLevel: newLevel > levelData.text_level };
    }

    // Add voice XP for time spent in voice channels
    async addVoiceXP(userId, minutes, channelMemberCount = 1) {
        let xpGain = this.xpConfig.voice.base * minutes;
        
        // Bonus for being in voice with others
        if (channelMemberCount > 1) {
            xpGain += this.xpConfig.voice.bonus * minutes;
        }

        // Apply multipliers
        const guild = this.client.guilds.cache.first(); // Assuming single guild bot
        const member = guild?.members.cache.get(userId);
        if (member) {
            const multiplier = this.getXPMultiplier(member);
            xpGain = Math.floor(xpGain * multiplier);
        }

        // Add XP to database
        await database.getUserLevels(userId);
        await database.addXP(userId, 'voice', xpGain);
        await database.addVoiceTime(userId, minutes);

        // Check for level up
        const levelData = await database.getUserLevels(userId);
        const newLevel = this.getLevelFromXP(levelData.voice_xp);
        
        if (newLevel > levelData.voice_level) {
            await this.handleLevelUp(userId, 'voice', levelData.voice_level, newLevel);
        }

        return { xpGain, newLevel: newLevel > levelData.voice_level };
    }

    // Add role-based XP for achievements
    async addRoleXP(userId, activityType, amount = null) {
        let xpGain;
        
        switch (activityType) {
            case 'daily_login':
                xpGain = this.xpConfig.role.dailyLogin;
                break;
            case 'message_streak':
                xpGain = this.xpConfig.role.messageStreak;
                break;
            case 'voice_streak':
                xpGain = this.xpConfig.role.voiceStreak;
                break;
            case 'helping_others':
                xpGain = this.xpConfig.role.helpingOthers;
                break;
            case 'event_participation':
                xpGain = this.xpConfig.role.eventParticipation;
                break;
            case 'custom':
                xpGain = amount || 0;
                break;
            default:
                return null;
        }

        // Apply multipliers
        const guild = this.client.guilds.cache.first();
        const member = guild?.members.cache.get(userId);
        if (member) {
            const multiplier = this.getXPMultiplier(member);
            xpGain = Math.floor(xpGain * multiplier);
        }

        // Add XP to database
        await database.getUserLevels(userId);
        await database.addXP(userId, 'role', xpGain);

        // Check for level up
        const levelData = await database.getUserLevels(userId);
        const newLevel = this.getLevelFromXP(levelData.role_xp);
        
        if (newLevel > levelData.role_level) {
            await this.handleLevelUp(userId, 'role', levelData.role_level, newLevel);
        }

        return { xpGain, newLevel: newLevel > levelData.role_level };
    }

    // Get XP multiplier based on user roles
    getXPMultiplier(member) {
        let multiplier = 1.0;
        
        // Check for booster role
        if (member.roles.cache.has(process.env.BOOSTER_ROLE_ID)) {
            multiplier += 0.5; // 50% bonus
        }
        
        // Check for premium role
        if (member.roles.cache.has(process.env.PREMIUM_ROLE_ID)) {
            multiplier += 0.75; // 75% bonus
        }

        return multiplier;
    }

    // Handle level up and rewards
    async handleLevelUp(userId, levelType, oldLevel, newLevel, channel = null) {
        // Update level in database
        await database.updateLevel(userId, levelType, newLevel);
        
        // Update overall level
        await this.updateOverallLevel(userId);

        // Check for rewards
        const rewards = this.levelRewards[levelType];
        if (rewards && rewards[newLevel]) {
            const reward = rewards[newLevel];
            await this.grantReward(userId, levelType, newLevel, reward);
        }

        // Send level up message
        if (channel) {
            await this.sendLevelUpMessage(channel, userId, levelType, newLevel);
        }
    }

    // Update overall level based on all XP types
    async updateOverallLevel(userId) {
        const levelData = await database.getUserLevels(userId);
        const newOverallLevel = this.getLevelFromXP(levelData.total_xp);
        
        if (newOverallLevel > levelData.overall_level) {
            await database.updateLevel(userId, 'overall', newOverallLevel);
            
            // Check for overall level rewards
            const rewards = this.levelRewards.overall;
            if (rewards && rewards[newOverallLevel]) {
                const reward = rewards[newOverallLevel];
                await this.grantReward(userId, 'overall', newOverallLevel, reward);
            }
        }
    }

    // Grant level rewards
    async grantReward(userId, levelType, level, reward) {
        try {
            switch (reward.type) {
                case 'currency':
                    await database.updateBalance(userId, reward.amount);
                    break;
                case 'role':
                    const guild = this.client.guilds.cache.first();
                    const member = guild?.members.cache.get(userId);
                    const role = guild?.roles.cache.get(reward.roleId);
                    if (member && role) {
                        await member.roles.add(role);
                    }
                    break;
                case 'title':
                    // Custom titles would be stored in user profiles
                    // This could be expanded based on your profile system
                    break;
            }

            // Create reward record
            await database.createLevelReward(userId, levelType, level, reward.type, reward);
            
        } catch (error) {
            console.error(`Error granting reward for ${userId}:`, error);
        }
    }

    // Send level up message
    async sendLevelUpMessage(channel, userId, levelType, newLevel) {
        const user = await this.client.users.fetch(userId);
        const typeEmojis = {
            text: '💬',
            voice: '🎤',
            role: '⭐',
            overall: '🏆'
        };

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle(`${typeEmojis[levelType]} Level Up!`)
            .setDescription(`**${user.username}** just reached **${levelType === 'overall' ? 'Overall' : levelType.charAt(0).toUpperCase() + levelType.slice(1)} Level ${newLevel}**!`)
            .setThumbnail(user.displayAvatarURL())
            .setTimestamp();

        // Add reward info if there's a reward for this level
        const rewards = this.levelRewards[levelType];
        if (rewards && rewards[newLevel]) {
            const reward = rewards[newLevel];
            embed.addFields([{
                name: '🎁 Level Reward',
                value: reward.message,
                inline: false
            }]);
        }

        try {
            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error sending level up message:', error);
        }
    }

    // Create level info embed
    async createLevelEmbed(userId, targetUserId = null) {
        const displayUserId = targetUserId || userId;
        const user = await this.client.users.fetch(displayUserId);
        const levelData = await database.getUserLevels(displayUserId);
        
        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setTitle(`📊 ${user.username}'s Levels`)
            .setThumbnail(user.displayAvatarURL())
            .setTimestamp();

        // Calculate progress for each level type
        const types = ['text', 'voice', 'role', 'overall'];
        const fields = [];

        types.forEach(type => {
            const xpKey = type === 'overall' ? 'total_xp' : `${type}_xp`;
            const levelKey = type === 'overall' ? 'overall_level' : `${type}_level`;
            
            const currentXP = levelData[xpKey];
            const currentLevel = levelData[levelKey];
            const progress = this.getXPProgress(currentXP, currentLevel);
            
            const emoji = type === 'text' ? '💬' : type === 'voice' ? '🎤' : type === 'role' ? '⭐' : '🏆';
            const typeName = type === 'overall' ? 'Overall' : type.charAt(0).toUpperCase() + type.slice(1);
            
            fields.push({
                name: `${emoji} ${typeName} Level ${currentLevel}`,
                value: `**XP:** ${currentXP.toLocaleString()}\n**Progress:** ${progress.current}/${progress.needed} (${progress.percentage}%)`,
                inline: true
            });
        });

        embed.addFields(fields);

        // Add additional stats
        if (levelData.voice_time_total > 0) {
            const hours = Math.floor(levelData.voice_time_total / 60);
            const minutes = levelData.voice_time_total % 60;
            embed.addFields([{
                name: '🎤 Voice Time',
                value: `${hours}h ${minutes}m total`,
                inline: true
            }]);
        }

        return embed;
    }

    // Start voice session tracking
    async startVoiceSession(userId, channelId) {
        const sessionId = await database.startVoiceSession(userId, channelId);
        this.voiceSessions.set(userId, {
            sessionId,
            channelId,
            startTime: Date.now(),
            lastXPTime: Date.now()
        });
    }

    // End voice session tracking
    async endVoiceSession(userId) {
        const session = this.voiceSessions.get(userId);
        if (!session) return;

        const duration = Date.now() - session.startTime;
        const minutes = Math.floor(duration / 60000);
        
        if (minutes >= 1) { // Only award XP for sessions longer than 1 minute
            const result = await this.addVoiceXP(userId, minutes);
            await database.endVoiceSession(session.sessionId, result?.xpGain || 0);
        }

        this.voiceSessions.delete(userId);
    }

    // Periodic voice XP update (called every minute for active sessions)
    async updateActiveVoiceSessions() {
        const now = Date.now();
        
        for (const [userId, session] of this.voiceSessions.entries()) {
            const timeSinceLastXP = now - session.lastXPTime;
            
            if (timeSinceLastXP >= 60000) { // 1 minute passed
                const guild = this.client.guilds.cache.first();
                const channel = guild?.channels.cache.get(session.channelId);
                const memberCount = channel?.members?.size || 1;
                
                await this.addVoiceXP(userId, 1, memberCount);
                session.lastXPTime = now;
            }
        }
    }
}

module.exports = LevelingSystem;