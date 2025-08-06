const { EmbedBuilder, AttachmentBuilder, PermissionFlagsBits } = require('discord.js');
const database = require('./database');
const config = require('../config.json');
const CanvasUtils = require('./utils/canvas');
const LuxuryDesign = require('./utils/luxury-design');

class SlashHandlers {
    constructor() {
        this.canvas = new CanvasUtils();
        this.design = new LuxuryDesign();
    }

    async handleBalance(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const user = await database.getUser(targetUser.id);
        
        if (!user) {
            await interaction.reply('❌ User not found in the system!');
            return;
        }

        // Get user level data for status display
        const levelData = await database.getUserLevels(targetUser.id);
        const maxLevel = Math.max(levelData.text_level, levelData.voice_level, levelData.role_level, levelData.overall_level);
        
        // Create styled elements
        const styledUsername = this.design.styleUsername(targetUser.username, maxLevel);
        const balanceAmount = this.design.styleRewardMessage(user.balance, config.currency.symbol);
        const titlePrefix = maxLevel >= 40 ? 'royal' : (maxLevel >= 25 ? 'elite' : 'cyber');
        const title = this.design.styleTitle(`${styledUsername}'s Treasury`, titlePrefix);
        
        const embed = this.design.createEmbed('royal')
            .setTitle(`${this.design.theme.emojis.gem} ${title}`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields([
                {
                    name: `${this.design.theme.emojis.magic} Current Balance`,
                    value: balanceAmount,
                    inline: true
                },
                {
                    name: `${this.design.theme.emojis.royal} Kingdom Status`,
                    value: this.getKingdomStatusSlim(maxLevel),
                    inline: true
                }
            ])
            .setFooter({ text: this.design.createFooter() });

        await interaction.reply({ embeds: [embed] });
    }

    // Helper method for slim kingdom status
    getKingdomStatusSlim(maxLevel) {
        if (maxLevel >= 50) return `${this.design.theme.emojis.crown} LEGEND`;
        if (maxLevel >= 40) return `${this.design.theme.emojis.diamond} ROYAL NOBILITY`;
        if (maxLevel >= 25) return `${this.design.theme.emojis.medal} COURT ARISTOCRAT`;
        if (maxLevel >= 10) return `${this.design.theme.emojis.gem} COURTIER`;
        return `${this.design.theme.emojis.magic} NEW SUBJECT`;
    }

    async handleDaily(interaction) {
        const user = await database.getUser(interaction.user.id);
        const now = new Date();
        const lastClaimed = user.daily_last_claimed ? new Date(user.daily_last_claimed) : null;

        if (lastClaimed && now - lastClaimed < 24 * 60 * 60 * 1000) {
            const timeLeft = 24 * 60 * 60 * 1000 - (now - lastClaimed);
            const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
            const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
            
            return await interaction.reply(`⏰ You can claim your daily reward in ${hoursLeft}h ${minutesLeft}m!`);
        }

        let amount = config.currency.dailyAmount;
        
        // Check for booster/premium bonuses
        const member = interaction.guild.members.cache.get(interaction.user.id);
        if (member.roles.cache.has(process.env.BOOSTER_ROLE_ID)) {
            amount += config.booster.dailyBonus;
        }
        if (member.roles.cache.has(process.env.PREMIUM_ROLE_ID)) {
            amount += config.premium.dailyBonus;
        }

        await database.updateBalance(interaction.user.id, amount);
        await database.updateDailyClaim(interaction.user.id);
        await database.addTransaction(interaction.user.id, 'daily', amount, 'Daily reward claimed');

        // Add role XP for daily login
        const bot = interaction.client.bot || interaction.client;
        if (bot.levelingSystem && config.leveling?.enabled) {
            try {
                await bot.levelingSystem.addRoleXP(interaction.user.id, 'daily_login');
            } catch (error) {
                console.error('Error adding role XP for daily:', error);
            }
        }

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('💰 Daily Reward Claimed!')
            .setDescription(`You received **${amount}** ${config.currency.symbol} ${config.currency.name}!`)
            .setFooter({ text: 'Come back tomorrow for another reward!' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }

    async handleWork(interaction) {
        const user = await database.getUser(interaction.user.id);
        const now = new Date();
        const lastWorked = user.work_last_used ? new Date(user.work_last_used) : null;

        if (lastWorked && now - lastWorked < 60 * 60 * 1000) {
            const timeLeft = 60 * 60 * 1000 - (now - lastWorked);
            const minutesLeft = Math.floor(timeLeft / (60 * 1000));
            
            return await interaction.reply(`⏰ You can work again in ${minutesLeft} minutes!`);
        }

        const jobs = [
            'delivered packages', 'coded a website', 'taught a class', 'wrote articles',
            'designed graphics', 'managed social media', 'fixed computers', 'cooked meals',
            'cleaned offices', 'walked dogs', 'painted houses', 'tutored students'
        ];

        let baseAmount = config.currency.workAmount;
        const randomMultiplier = Math.random() * 0.5 + 0.75;
        let amount = Math.floor(baseAmount * randomMultiplier);

        // Check for booster/premium bonuses
        const member = interaction.guild.members.cache.get(interaction.user.id);
        if (member.roles.cache.has(process.env.BOOSTER_ROLE_ID)) {
            amount += config.booster.workBonus;
        }
        if (member.roles.cache.has(process.env.PREMIUM_ROLE_ID)) {
            amount += config.premium.workBonus;
        }

        const randomJob = jobs[Math.floor(Math.random() * jobs.length)];

        await database.updateBalance(interaction.user.id, amount);
        await database.updateWorkClaim(interaction.user.id);
        await database.addTransaction(interaction.user.id, 'work', amount, `Worked: ${randomJob}`);

        // Add role XP for work activity
        const bot = interaction.client.bot || interaction.client;
        if (bot.levelingSystem && config.leveling?.enabled) {
            try {
                // Use a custom amount based on work earnings
                const xpAmount = Math.floor(amount / 2); // XP = half of earnings
                await bot.levelingSystem.addRoleXP(interaction.user.id, 'custom', xpAmount);
            } catch (error) {
                console.error('Error adding role XP for work:', error);
            }
        }

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('💼 Work Complete!')
            .setDescription(`You ${randomJob} and earned **${amount}** ${config.currency.symbol} ${config.currency.name}!`)
            .setFooter({ text: 'You can work again in 1 hour!' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }

    async handleLeaderboard(interaction) {
        const topUsers = await database.getTopUsers(10);
        
        if (topUsers.length === 0) {
            return await interaction.reply('📊 No users found in the leaderboard yet!');
        }

        let description = '';
        for (let i = 0; i < topUsers.length; i++) {
            const user = topUsers[i];
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
            description += `${medal} **${user.username}** - ${user.balance} ${config.currency.symbol}\n`;
        }

        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setTitle('🏆 WonderCash Leaderboard')
            .setDescription(description)
            .setFooter({ text: 'Keep earning to climb the ranks!' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }

    async handleCoinflip(interaction) {
        const choice = interaction.options.getString('choice');
        const amount = interaction.options.getInteger('amount');

        const user = await database.getUser(interaction.user.id);
        if (user.balance < amount) {
            return await interaction.reply(`❌ You don't have enough ${config.currency.name}! Your balance: ${user.balance} ${config.currency.symbol}`);
        }

        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        const won = choice === result;
        const winAmount = won ? amount : -amount;

        await database.updateBalance(interaction.user.id, winAmount);
        await database.addTransaction(interaction.user.id, 'coinflip', winAmount, `Coinflip ${won ? 'win' : 'loss'}: ${choice} vs ${result}`);

        const embed = new EmbedBuilder()
            .setColor(won ? config.colors.success : config.colors.error)
            .setTitle('🪙 Coin Flip Result')
            .setDescription(`The coin landed on **${result}**!\n\n${won ? '🎉 You won!' : '😔 You lost!'}\n**${won ? '+' : ''}${winAmount}** ${config.currency.symbol} ${config.currency.name}`)
            .setFooter({ text: `Your balance: ${user.balance + winAmount} ${config.currency.symbol}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }

    async handleDice(interaction) {
        const amount = interaction.options.getInteger('amount');

        const user = await database.getUser(interaction.user.id);
        if (user.balance < amount) {
            return await interaction.reply(`❌ You don't have enough ${config.currency.name}! Your balance: ${user.balance} ${config.currency.symbol}`);
        }

        const dice1 = Math.floor(Math.random() * 6) + 1;
        const dice2 = Math.floor(Math.random() * 6) + 1;
        const total = dice1 + dice2;

        let multiplier = 0;
        let result = '';

        if (total === 7) {
            multiplier = 3;
            result = '🎉 Lucky 7! Triple your bet!';
        } else if (total === 2 || total === 12) {
            multiplier = 2;
            result = '🎊 Snake eyes or Boxcars! Double your bet!';
        } else if (total >= 8 && total <= 10) {
            multiplier = 1.5;
            result = '😊 Good roll! 1.5x your bet!';
        } else {
            multiplier = 0;
            result = '😔 Better luck next time!';
        }

        const winAmount = Math.floor(amount * multiplier) - amount;

        await database.updateBalance(interaction.user.id, winAmount);
        await database.addTransaction(interaction.user.id, 'dice', winAmount, `Dice roll: ${dice1}+${dice2}=${total}`);

        const embed = new EmbedBuilder()
            .setColor(winAmount > 0 ? config.colors.success : config.colors.error)
            .setTitle('🎲 Dice Roll Result')
            .setDescription(`🎲 ${dice1} + ${dice2} = **${total}**\n\n${result}\n**${winAmount >= 0 ? '+' : ''}${winAmount}** ${config.currency.symbol} ${config.currency.name}`)
            .setFooter({ text: `Your balance: ${user.balance + winAmount} ${config.currency.symbol}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }

    async handleSlots(interaction) {
        const amount = interaction.options.getInteger('amount');

        const user = await database.getUser(interaction.user.id);
        if (user.balance < amount) {
            return await interaction.reply(`❌ You don't have enough ${config.currency.name}! Your balance: ${user.balance} ${config.currency.symbol}`);
        }

        const symbols = ['🍒', '🍋', '🍊', '🍇', '🔔', '💎', '7️⃣'];
        const reel1 = symbols[Math.floor(Math.random() * symbols.length)];
        const reel2 = symbols[Math.floor(Math.random() * symbols.length)];
        const reel3 = symbols[Math.floor(Math.random() * symbols.length)];

        let multiplier = 0;
        let result = '';

        if (reel1 === reel2 && reel2 === reel3) {
            if (reel1 === '💎') {
                multiplier = 10;
                result = '💎 JACKPOT! Diamond Triple!';
            } else if (reel1 === '7️⃣') {
                multiplier = 7;
                result = '🎰 Lucky 777!';
            } else {
                multiplier = 3;
                result = '🎉 Triple Match!';
            }
        } else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
            multiplier = 1.5;
            result = '😊 Double Match!';
        } else {
            multiplier = 0;
            result = '😔 No match, try again!';
        }

        const winAmount = Math.floor(amount * multiplier) - amount;

        await database.updateBalance(interaction.user.id, winAmount);
        await database.addTransaction(interaction.user.id, 'slots', winAmount, `Slots: ${reel1}${reel2}${reel3}`);

        const embed = new EmbedBuilder()
            .setColor(winAmount > 0 ? config.colors.success : config.colors.error)
            .setTitle('🎰 Slot Machine')
            .setDescription(`${reel1} | ${reel2} | ${reel3}\n\n${result}\n**${winAmount >= 0 ? '+' : ''}${winAmount}** ${config.currency.symbol} ${config.currency.name}`)
            .setFooter({ text: `Your balance: ${user.balance + winAmount} ${config.currency.symbol}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }

    async handleHelp(interaction) {
        const embed = this.design.createEmbed('royal')
            .setTitle(`${this.design.theme.emojis.kingdom} ${this.design.styleTitle('Luxury Kingdom Commands', 'royal')}`)
            .setDescription(`${this.design.theme.emojis.magic} **Welcome to the Luxury Kingdom!** ${this.design.theme.emojis.magic}\n${this.design.createDivider()}\nHere are all available commands to rule your royal empire:`)
            .addFields(
                {
                    name: `${this.design.theme.emojis.treasure} Economy Commands`,
                    value: '`/balance` - Check WonderCoins treasury\n`/daily` - Claim royal daily reward\n`/work` - Work for the kingdom\n`/leaderboard` - View top earners',
                    inline: false
                },
                {
                    name: `${this.design.theme.emojis.diamond} Game Commands`,
                    value: '`/coinflip` - Royal coin flip game\n`/dice` - Royal dice rolling\n`/slots` - Palace slot machine',
                    inline: false
                },
                {
                    name: `${this.design.theme.emojis.royal} Introduction Commands`,
                    value: '`/intro create` - Create royal introduction card\n`/intro view` - View noble profiles',
                    inline: false
                },
                {
                    name: `${this.design.theme.emojis.crown} Leveling Commands`,
                    value: '`/level` - Check your royal levels and XP\n`/rank` - View nobility leaderboards\n`/rewards` - Claim level rewards\n`/give-xp` - Give XP (Admin)\n`/reset-level` - Reset levels (Admin)',
                    inline: false
                },
                {
                    name: `${this.design.theme.emojis.star} Giveaway Commands`,
                    value: '`/giveaway start` - Start royal giveaway (Admin)\n`/giveaway list` - List active giveaways\n`/giveaway wins` - View your victories',
                    inline: false
                },
                {
                    name: `${this.design.theme.emojis.scepter} Admin Commands`,
                    value: '`/setup welcome` - Setup welcome system\n`/setup introduction` - Setup introduction channel\n`/level-role set` - Set role rewards for levels\n`/level-role remove` - Remove role rewards\n`/level-role list` - List all role rewards',
                    inline: false
                },
                {
                    name: `${this.design.theme.emojis.magic} Exclusive Perks`,
                    value: '**Server Boosters:** +50 daily, +25 work bonus, **1.5x XP**, **2x giveaway odds**\n**Premium Members:** +100 daily, +50 work bonus, **1.75x XP**, **3x giveaway odds**, **bypass winner restrictions**',
                    inline: false
                },
                {
                    name: `${this.design.theme.emojis.kingdom} Royal Leveling System`,
                    value: '**Text Level:** Gain XP by chatting (15-25 XP per message)\n**Voice Level:** Gain XP in voice channels (10-15 XP per minute, only when unmuted)\n**Role Level:** Gain XP through daily activities and achievements\n**Kingdom Level:** Combined progress from all categories\n\n**🏆 MAX LEVEL: 50 for all categories!**',
                    inline: false
                }
            )
            .setFooter({ text: this.design.createFooter('Luxury Kingdom Bot • Royal Elegance Awaits') })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
}

module.exports = SlashHandlers;