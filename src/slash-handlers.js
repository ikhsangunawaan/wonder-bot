const { EmbedBuilder, AttachmentBuilder, PermissionFlagsBits } = require('discord.js');
const database = require('./database');
const config = require('../config.json');
const CanvasUtils = require('./utils/canvas');
const Y2KDesign = require('./utils/y2k-design');

class SlashHandlers {
    constructor() {
        this.canvas = new CanvasUtils();
        this.design = new Y2KDesign();
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
        if (maxLevel >= 40) return `${this.design.theme.emojis.gem} ROYAL ELITE`;
        if (maxLevel >= 25) return `${this.design.theme.emojis.star} CYBER NOBLE`;
        if (maxLevel >= 10) return `${this.design.theme.emojis.crystal} CITIZEN`;
        return `${this.design.theme.emojis.magic} NEW ARRIVAL`;
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

    async handleIntro(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {
            // This will be handled by the modal in the main bot file
            await interaction.bot.showIntroductionModal(interaction);
        } else if (subcommand === 'view') {
            const targetUser = interaction.options.getUser('user') || interaction.user;
            const cardData = await database.getIntroCard(targetUser.id);

            if (!cardData) {
                return await interaction.reply(`❌ ${targetUser.username} hasn't created an introduction card yet!`);
            }

            try {
                const cardBuffer = await this.canvas.createIntroductionCard(targetUser, cardData);
                const attachment = new AttachmentBuilder(cardBuffer, { name: 'introduction.png' });

                const embed = new EmbedBuilder()
                    .setColor(cardData.favorite_color || config.colors.primary)
                    .setTitle(`📝 ${cardData.name}'s Introduction Card`)
                    .setImage('attachment://introduction.png')
                    .setFooter({ text: 'Wonder Bot', iconURL: interaction.client.user.displayAvatarURL() })
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], files: [attachment] });
            } catch (error) {
                console.error('Error creating introduction card:', error);
                await interaction.reply({ content: '❌ There was an error displaying the introduction card!', ephemeral: true });
            }
        }
    }

    async handleSetup(interaction) {
        // Check if user has admin permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({ content: '❌ You need Administrator permissions to use this command!', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'welcome') {
            const channel = interaction.options.getChannel('channel');
            const message = interaction.options.getString('message') || 'Welcome to our amazing server!';

            try {
                await database.updateServerSettings(interaction.guild.id, {
                    welcomeChannel: channel.id,
                    welcomeMessage: message
                });

                const embed = new EmbedBuilder()
                    .setColor(config.colors.success)
                    .setTitle('✅ Welcome Settings Updated!')
                    .setDescription(`**Welcome Channel:** ${channel}\n**Welcome Message:** ${message}`)
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
            } catch (error) {
                console.error('Error updating welcome settings:', error);
                await interaction.reply({ content: '❌ There was an error updating the welcome settings!', ephemeral: true });
            }
        } else if (subcommand === 'introduction') {
            const channel = interaction.options.getChannel('channel');

            try {
                const settings = await database.getServerSettings(interaction.guild.id);
                await database.updateServerSettings(interaction.guild.id, {
                    welcomeChannel: settings?.welcome_channel,
                    introductionChannel: channel.id,
                    welcomeMessage: settings?.welcome_message
                });

                const embed = new EmbedBuilder()
                    .setColor(config.colors.success)
                    .setTitle('✅ Introduction Channel Updated!')
                    .setDescription(`**Introduction Channel:** ${channel}`)
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
            } catch (error) {
                console.error('Error updating introduction settings:', error);
                await interaction.reply({ content: '❌ There was an error updating the introduction settings!', ephemeral: true });
            }
        }
    }

    async handleHelp(interaction) {
        const embed = this.design.createEmbed('cyber')
            .setTitle(`${this.design.theme.emojis.kingdom} ${this.design.styleTitle('Y2K Kingdom Commands', 'royal')}`)
            .setDescription(`${this.design.theme.emojis.magic} **Welcome to the Y2K Kingdom!** ${this.design.theme.emojis.magic}\n${this.design.createDivider()}\nHere are all available commands to rule your digital empire:`)
            .addFields(
                {
                    name: `${this.design.theme.emojis.gem} Economy Commands`,
                    value: '`/balance` - Check WonderCash treasury\n`/daily` - Claim royal daily reward\n`/work` - Work for the kingdom\n`/leaderboard` - View top earners',
                    inline: false
                },
                {
                    name: `${this.design.theme.emojis.cyber} Game Commands`,
                    value: '`/coinflip` - Cyber coin flip game\n`/dice` - Digital dice rolling\n`/slots` - Y2K slot machine',
                    inline: false
                },
                {
                    name: `${this.design.theme.emojis.royal} Introduction Commands`,
                    value: '`/intro create` - Create royal introduction card\n`/intro view` - View citizen profiles',
                    inline: false
                },
                {
                    name: `${this.design.theme.emojis.crown} Leveling Commands`,
                    value: '`/level` - Check your kingdom levels and XP\n`/rank` - View royal leaderboards\n`/rewards` - Claim level rewards\n`/give-xp` - Give XP (Admin)\n`/reset-level` - Reset levels (Admin)',
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
                    name: `${this.design.theme.emojis.kingdom} Y2K Leveling System`,
                    value: '**Text Level:** Gain XP by chatting (15-25 XP per message)\n**Voice Level:** Gain XP in voice channels (10-15 XP per minute, only when unmuted)\n**Role Level:** Gain XP through daily activities and achievements\n**Kingdom Level:** Combined progress from all categories\n\n**🏆 MAX LEVEL: 50 for all categories!**',
                    inline: false
                }
            )
            .setFooter({ text: this.design.createFooter('Y2K Kingdom Bot • Cyber Royalty Awaits') })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }

    async handleGiveaway(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'start':
                await this.handleGiveawayStart(interaction);
                break;
            case 'end':
                await this.handleGiveawayEnd(interaction);
                break;
            case 'reroll':
                await this.handleGiveawayReroll(interaction);
                break;
            case 'list':
                await this.handleGiveawayList(interaction);
                break;
            case 'stats':
                await this.handleGiveawayStats(interaction);
                break;
            case 'wins':
                await this.handleGiveawayWins(interaction);
                break;
        }
    }

    async handleGiveawayStart(interaction) {
        if (!interaction.member.permissions.has('MANAGE_GUILD')) {
            return await interaction.reply({ 
                content: '❌ You need **Manage Server** permissions to create giveaways!', 
                ephemeral: true 
            });
        }

        const duration = interaction.options.getString('duration');
        const winners = interaction.options.getInteger('winners');
        const prize = interaction.options.getString('prize');
        const title = interaction.options.getString('title') || 'Giveaway';
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const restrictWinners = interaction.options.getBoolean('restrict_winners') ?? true;

        // Parse duration
        const durationMinutes = interaction.bot.parseDuration(duration);
        if (!durationMinutes) {
            return await interaction.reply({ 
                content: '❌ Invalid duration! Use format like: 1h, 30m, 2d, etc.', 
                ephemeral: true 
            });
        }

        try {
            const giveaway = await interaction.bot.giveawaySystem.createGiveaway(interaction.guild, channel.id, {
                title: title,
                description: `Win **${prize}**!`,
                prize: prize,
                winnerCount: winners,
                duration: durationMinutes,
                createdBy: interaction.user.id,
                restrictWinners: restrictWinners
            });

            const embed = interaction.bot.giveawaySystem.createGiveawayEmbed(giveaway);
            const button = interaction.bot.giveawaySystem.createGiveawayButton(giveaway.id);

            const giveawayMessage = await channel.send({
                content: '🎉 **GIVEAWAY** 🎉',
                embeds: [embed],
                components: [button]
            });

            await database.updateGiveawayMessageId(giveaway.id, giveawayMessage.id);

            await interaction.reply({ 
                content: `✅ Giveaway created successfully in ${channel}!`, 
                ephemeral: true 
            });

        } catch (error) {
            console.error('Error creating giveaway:', error);
            await interaction.reply({ 
                content: '❌ Failed to create giveaway!', 
                ephemeral: true 
            });
        }
    }

    async handleGiveawayEnd(interaction) {
        if (!interaction.member.permissions.has('MANAGE_GUILD')) {
            return await interaction.reply({ 
                content: '❌ You need **Manage Server** permissions to end giveaways!', 
                ephemeral: true 
            });
        }

        const giveawayId = interaction.options.getInteger('giveaway_id');

        try {
            await interaction.bot.giveawaySystem.endGiveaway(giveawayId);
            await interaction.reply({ content: '✅ Giveaway ended successfully!', ephemeral: true });
        } catch (error) {
            console.error('Error ending giveaway:', error);
            await interaction.reply({ content: '❌ Failed to end giveaway!', ephemeral: true });
        }
    }

    async handleGiveawayReroll(interaction) {
        if (!interaction.member.permissions.has('MANAGE_GUILD')) {
            return await interaction.reply({ 
                content: '❌ You need **Manage Server** permissions to reroll giveaways!', 
                ephemeral: true 
            });
        }

        const giveawayId = interaction.options.getInteger('giveaway_id');

        try {
            const result = await interaction.bot.giveawaySystem.rerollGiveaway(giveawayId);
            if (result.success) {
                const winnerMentions = result.winners.map(w => `<@${w.user_id}>`).join(', ');
                await interaction.reply({ content: `🎉 New winners: ${winnerMentions}!`, ephemeral: true });
            } else {
                await interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });
            }
        } catch (error) {
            console.error('Error rerolling giveaway:', error);
            await interaction.reply({ content: '❌ Failed to reroll giveaway!', ephemeral: true });
        }
    }

    async handleGiveawayList(interaction) {
        try {
            const giveaways = await interaction.bot.giveawaySystem.getServerGiveaways(interaction.guild.id, false, 5);
            
            if (giveaways.length === 0) {
                return await interaction.reply('📭 No active giveaways in this server!');
            }

            const embed = new EmbedBuilder()
                .setColor(config.colors.primary)
                .setTitle('🎉 Active Giveaways')
                .setDescription('Here are the current active giveaways:')
                .setTimestamp();

            for (const giveaway of giveaways) {
                const endTime = new Date(giveaway.created_at);
                endTime.setMinutes(endTime.getMinutes() + giveaway.duration);
                
                embed.addFields({
                    name: `ID: ${giveaway.id} - ${giveaway.title}`,
                    value: `**Prize:** ${giveaway.prize}\n**Winners:** ${giveaway.winner_count}\n**Ends:** <t:${Math.floor(endTime.getTime() / 1000)}:R>`,
                    inline: true
                });
            }

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error listing giveaways:', error);
            await interaction.reply({ content: '❌ Failed to list giveaways!', ephemeral: true });
        }
    }

    async handleGiveawayStats(interaction) {
        const giveawayId = interaction.options.getInteger('giveaway_id');

        try {
            const stats = await interaction.bot.giveawaySystem.getGiveawayStats(giveawayId);
            if (!stats) {
                return await interaction.reply({ content: '❌ Giveaway not found!', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor(config.colors.info)
                .setTitle(`📊 Giveaway #${giveawayId} Statistics`)
                .addFields(
                    { name: '👥 Total Entries', value: stats.totalEntries.toString(), inline: true },
                    { name: '👤 Regular Members', value: stats.regularEntries.toString(), inline: true },
                    { name: '🚀 Server Boosters', value: stats.boosterEntries.toString(), inline: true },
                    { name: '⭐ Premium Members', value: stats.premiumEntries.toString(), inline: true },
                    { name: '⚖️ Total Weight', value: stats.totalWeight.toString(), inline: true },
                    { name: '📈 Weighted Distribution', value: `Regular: ${((stats.regularEntries / stats.totalWeight) * 100).toFixed(1)}%\nBoosters: ${((stats.boosterEntries * 2 / stats.totalWeight) * 100).toFixed(1)}%\nPremium: ${((stats.premiumEntries * 3 / stats.totalWeight) * 100).toFixed(1)}%`, inline: false }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error getting giveaway stats:', error);
            await interaction.reply({ content: '❌ Failed to get giveaway statistics!', ephemeral: true });
        }
    }

    async handleGiveawayWins(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;

        try {
            const wins = await interaction.bot.giveawaySystem.getUserGiveawayHistory(targetUser.id, 10);
            
            if (wins.length === 0) {
                return await interaction.reply(`🎭 ${targetUser.username} hasn't won any giveaways yet!`);
            }

            const embed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle(`🏆 ${targetUser.username}'s Giveaway Wins`)
                .setDescription(`${targetUser.username} has won ${wins.length} giveaway${wins.length > 1 ? 's' : ''}!`)
                .setTimestamp();

            for (const win of wins.slice(0, 5)) {
                const wonDate = new Date(win.won_at);
                embed.addFields({
                    name: `${win.title}`,
                    value: `**Prize:** ${win.prize}\n**Won:** <t:${Math.floor(wonDate.getTime() / 1000)}:R>`,
                    inline: true
                });
            }

            if (wins.length > 5) {
                embed.setFooter({ text: `Showing 5 of ${wins.length} total wins` });
            }

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error getting user wins:', error);
            await interaction.reply({ content: '❌ Failed to get giveaway history!', ephemeral: true });
        }
    }

    // ================== LEVELING HANDLERS ==================

    async handleLevel(interaction) {
        try {
            const targetUser = interaction.options.getUser('user') || interaction.user;
            const bot = interaction.client.bot || interaction.client;
            
            if (!bot.levelingSystem) {
                await interaction.reply({ content: '❌ Leveling system is not available!', ephemeral: true });
                return;
            }

            const embed = await bot.levelingSystem.createLevelEmbed(interaction.user.id, targetUser.id);
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error getting level info:', error);
            await interaction.reply({ content: '❌ Failed to get level information!', ephemeral: true });
        }
    }

    async handleRank(interaction) {
        try {
            const type = interaction.options.getString('type') || 'overall';
            const bot = interaction.client.bot || interaction.client;
            
            if (!bot.levelingSystem) {
                await interaction.reply({ content: '❌ Leveling system is not available!', ephemeral: true });
                return;
            }

            const topUsers = await database.getTopUsers(type, 15);
            
            // Create styled title
            const typeName = type === 'overall' ? 'Kingdom' : type.charAt(0).toUpperCase() + type.slice(1);
            const title = this.design.styleTitle(`${typeName} Leaderboard`, 'royal');
            const icon = this.design.getLevelTypeIcon(type);

            const embed = this.design.createEmbed('royal')
                .setTitle(`${icon} ${title}`)
                .setDescription(`${this.design.theme.emojis.magic} **Top Performers in the Y2K Kingdom** ${this.design.theme.emojis.magic}`)
                .setTimestamp();

            if (topUsers.length === 0) {
                embed.addFields([{
                    name: `${this.design.theme.emojis.crystal} No Data`,
                    value: 'No users found on the leaderboard yet!',
                    inline: false
                }]);
            } else {
                let description = '';
                for (let i = 0; i < topUsers.length; i++) {
                    const user = topUsers[i];
                    const position = i + 1;
                    const rankDisplay = this.design.createRankDisplay(position);
                    
                    const xpKey = type === 'overall' ? 'total_xp' : `${type}_xp`;
                    const levelKey = type === 'overall' ? 'overall_level' : `${type}_level`;
                    
                    const levelBadge = this.design.createLevelBadge(user[levelKey]);
                    const styledUsername = this.design.styleUsername(user.username, user[levelKey]);
                    const xpFormatted = this.design.formatNumber(user[xpKey]);
                    
                    description += `${rankDisplay} **${styledUsername}** ${this.design.createFieldSeparator()} ${levelBadge} ${this.design.createFieldSeparator()} ${xpFormatted} XP\n`;
                }
                
                embed.addFields([{
                    name: `${this.design.theme.emojis.scepter} Royal Rankings`,
                    value: description,
                    inline: false
                }]);
            }

            embed.setFooter({ text: this.design.createFooter() });
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            await interaction.reply({ content: '❌ Failed to get leaderboard!', ephemeral: true });
        }
    }

    async handleRewards(interaction) {
        try {
            const rewards = await database.getUnclaimedRewards(interaction.user.id);
            
            if (rewards.length === 0) {
                await interaction.reply({ content: '🎁 You have no unclaimed rewards!', ephemeral: true });
                return;
            }

            const embed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle('🎁 Your Unclaimed Rewards')
                .setDescription(`You have ${rewards.length} unclaimed reward${rewards.length > 1 ? 's' : ''}!`)
                .setTimestamp();

            for (const reward of rewards.slice(0, 10)) { // Show max 10 rewards
                const rewardData = JSON.parse(reward.reward_data);
                const typeEmoji = reward.level_type === 'text' ? '💬' : 
                                 reward.level_type === 'voice' ? '🎤' : 
                                 reward.level_type === 'role' ? '⭐' : '🏆';
                
                embed.addFields([{
                    name: `${typeEmoji} Level ${reward.level} - ${reward.level_type.charAt(0).toUpperCase() + reward.level_type.slice(1)}`,
                    value: rewardData.message,
                    inline: true
                }]);
            }

            if (rewards.length > 10) {
                embed.setFooter({ text: `Showing 10 of ${rewards.length} rewards` });
            }

            // Auto-claim all rewards
            let totalCurrency = 0;
            for (const reward of rewards) {
                const rewardData = JSON.parse(reward.reward_data);
                if (rewardData.type === 'currency') {
                    totalCurrency += rewardData.amount;
                }
                await database.claimLevelReward(reward.id);
            }

            if (totalCurrency > 0) {
                await database.updateBalance(interaction.user.id, totalCurrency);
                embed.addFields([{
                    name: '💰 Currency Claimed',
                    value: `You received **${totalCurrency}** ${config.currency.symbol} ${config.currency.name}!`,
                    inline: false
                }]);
            }

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error handling rewards:', error);
            await interaction.reply({ content: '❌ Failed to get rewards!', ephemeral: true });
        }
    }

    async handleGiveXP(interaction) {
        try {
            // Check permissions
            if (!interaction.member.permissions.has('ADMINISTRATOR')) {
                await interaction.reply({ content: '❌ You need Administrator permissions to use this command!', ephemeral: true });
                return;
            }

            const targetUser = interaction.options.getUser('user');
            const xpType = interaction.options.getString('type');
            const amount = interaction.options.getInteger('amount');
            const bot = interaction.client.bot || interaction.client;

            if (!bot.levelingSystem) {
                await interaction.reply({ content: '❌ Leveling system is not available!', ephemeral: true });
                return;
            }

            await database.createUser(targetUser.id, targetUser.username);
            await database.addXP(targetUser.id, xpType, amount);

            // Check for level up
            const levelData = await database.getUserLevels(targetUser.id);
            const newLevel = bot.levelingSystem.getLevelFromXP(levelData[`${xpType}_xp`]);
            const currentLevel = levelData[`${xpType}_level`];

            if (newLevel > currentLevel) {
                await bot.levelingSystem.handleLevelUp(targetUser.id, xpType, currentLevel, newLevel, interaction.channel);
            }

            const embed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle('✅ XP Given!')
                .setDescription(`Successfully gave **${amount} ${xpType} XP** to ${targetUser}!`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error giving XP:', error);
            await interaction.reply({ content: '❌ Failed to give XP!', ephemeral: true });
        }
    }

    async handleResetLevel(interaction) {
        try {
            // Check permissions
            if (!interaction.member.permissions.has('ADMINISTRATOR')) {
                await interaction.reply({ content: '❌ You need Administrator permissions to use this command!', ephemeral: true });
                return;
            }

            const targetUser = interaction.options.getUser('user');
            const resetType = interaction.options.getString('type') || 'all';

            await database.createUser(targetUser.id, targetUser.username);

            if (resetType === 'all') {
                // Reset all levels and XP
                await database.db.run(`
                    UPDATE user_levels SET 
                    text_xp = 0, text_level = 1,
                    voice_xp = 0, voice_level = 1,
                    role_xp = 0, role_level = 1,
                    total_xp = 0, overall_level = 1,
                    voice_time_total = 0
                    WHERE user_id = ?
                `, [targetUser.id]);
            } else {
                // Reset specific type
                const xpColumn = `${resetType}_xp`;
                const levelColumn = `${resetType}_level`;
                await database.db.run(`
                    UPDATE user_levels SET 
                    ${xpColumn} = 0, 
                    ${levelColumn} = 1,
                    total_xp = total_xp - ${xpColumn}
                    WHERE user_id = ?
                `, [targetUser.id]);
            }

            const embed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setTitle('🔄 Levels Reset!')
                .setDescription(`Successfully reset **${resetType === 'all' ? 'all levels' : resetType + ' level'}** for ${targetUser}!`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error resetting levels:', error);
            await interaction.reply({ content: '❌ Failed to reset levels!', ephemeral: true });
        }
    }

    async handleLevelRole(interaction) {
        try {
            // Check permissions
            if (!interaction.member.permissions.has('ADMINISTRATOR')) {
                await interaction.reply({ content: '❌ You need Administrator permissions to use this command!', ephemeral: true });
                return;
            }

            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'set':
                    await this.handleLevelRoleSet(interaction);
                    break;
                case 'remove':
                    await this.handleLevelRoleRemove(interaction);
                    break;
                case 'list':
                    await this.handleLevelRoleList(interaction);
                    break;
            }
        } catch (error) {
            console.error('Error handling level role command:', error);
            await interaction.reply({ content: '❌ Failed to execute command!', ephemeral: true });
        }
    }

    async handleLevelRoleSet(interaction) {
        const levelType = interaction.options.getString('level_type');
        const level = interaction.options.getInteger('level');
        const role = interaction.options.getRole('role');

        try {
            // Check if role exists
            if (!role) {
                await interaction.reply({ content: '❌ Invalid role specified!', ephemeral: true });
                return;
            }

            // Set the role reward
            await database.setLevelRoleReward(levelType, level, role.id, role.name, interaction.user.id);

            const embed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle('✅ Role Reward Set!')
                .setDescription(`Successfully set **${role.name}** as reward for **${levelType.charAt(0).toUpperCase() + levelType.slice(1)} Level ${level}**!`)
                .addFields([
                    {
                        name: '📊 Details',
                        value: `**Level Type:** ${levelType.charAt(0).toUpperCase() + levelType.slice(1)}\n**Level:** ${level}\n**Role:** ${role}\n**Set by:** ${interaction.user}`,
                        inline: false
                    }
                ])
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error setting level role reward:', error);
            await interaction.reply({ content: '❌ Failed to set role reward!', ephemeral: true });
        }
    }

    async handleLevelRoleRemove(interaction) {
        const levelType = interaction.options.getString('level_type');
        const level = interaction.options.getInteger('level');

        try {
            // Check if reward exists
            const existingReward = await database.getLevelRoleReward(levelType, level);
            if (!existingReward) {
                await interaction.reply({ content: `❌ No role reward found for ${levelType} level ${level}!`, ephemeral: true });
                return;
            }

            // Remove the role reward
            await database.removeLevelRoleReward(levelType, level);

            const embed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setTitle('🗑️ Role Reward Removed!')
                .setDescription(`Successfully removed role reward for **${levelType.charAt(0).toUpperCase() + levelType.slice(1)} Level ${level}**!`)
                .addFields([
                    {
                        name: '📊 Removed Details',
                        value: `**Level Type:** ${levelType.charAt(0).toUpperCase() + levelType.slice(1)}\n**Level:** ${level}\n**Role:** ${existingReward.role_name}\n**Removed by:** ${interaction.user}`,
                        inline: false
                    }
                ])
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error removing level role reward:', error);
            await interaction.reply({ content: '❌ Failed to remove role reward!', ephemeral: true });
        }
    }

    async handleLevelRoleList(interaction) {
        const levelType = interaction.options.getString('level_type');

        try {
            const roleRewards = await database.getAllLevelRoleRewards(levelType);

            if (roleRewards.length === 0) {
                const message = levelType ? 
                    `No role rewards configured for ${levelType} levels!` : 
                    'No role rewards configured yet!';
                await interaction.reply({ content: `📝 ${message}`, ephemeral: true });
                return;
            }

            const embed = new EmbedBuilder()
                .setColor(config.colors.primary)
                .setTitle('🏆 Level Role Rewards Configuration')
                .setDescription(levelType ? 
                    `Role rewards for **${levelType.charAt(0).toUpperCase() + levelType.slice(1)}** levels:` : 
                    'All configured role rewards:')
                .setTimestamp();

            // Group by level type
            const groupedRewards = {};
            roleRewards.forEach(reward => {
                if (!groupedRewards[reward.level_type]) {
                    groupedRewards[reward.level_type] = [];
                }
                groupedRewards[reward.level_type].push(reward);
            });

            // Add fields for each level type
            Object.entries(groupedRewards).forEach(([type, rewards]) => {
                const typeEmoji = type === 'text' ? '💬' : type === 'voice' ? '🎤' : type === 'role' ? '⭐' : '🏆';
                const rewardsList = rewards
                    .sort((a, b) => a.level - b.level)
                    .map(r => `Level ${r.level}: **${r.role_name}**`)
                    .join('\n');

                embed.addFields([{
                    name: `${typeEmoji} ${type.charAt(0).toUpperCase() + type.slice(1)} Levels`,
                    value: rewardsList || 'No rewards configured',
                    inline: true
                }]);
            });

            if (roleRewards.length > 20) {
                embed.setFooter({ text: `Showing ${Math.min(20, roleRewards.length)} of ${roleRewards.length} rewards` });
            }

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error listing level role rewards:', error);
            await interaction.reply({ content: '❌ Failed to list role rewards!', ephemeral: true });
        }
    }
}

module.exports = SlashHandlers;