const { EmbedBuilder, AttachmentBuilder, PermissionFlagsBits } = require('discord.js');
const database = require('./database');
const config = require('../config.json');
const CanvasUtils = require('./utils/canvas');

class SlashHandlers {
    constructor() {
        this.canvas = new CanvasUtils();
    }

    async handleBalance(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const user = await database.getUser(targetUser.id);
        
        if (!user) {
            await database.createUser(targetUser.id, targetUser.username);
            const newUser = await database.getUser(targetUser.id);
            user = newUser;
        }

        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setTitle(`💰 ${targetUser.username}'s Wallet`)
            .setDescription(`**Balance:** ${user.balance} ${config.currency.symbol} ${config.currency.name}`)
            .setThumbnail(targetUser.displayAvatarURL())
            .setFooter({ text: 'Wonder Bot Economy' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
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
        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setTitle('🤖 Wonder Bot Commands')
            .setDescription('Here are all the available commands:')
            .addFields(
                {
                    name: '💰 Economy Commands',
                    value: '`/balance` - Check WonderCash balance\n`/daily` - Claim daily reward\n`/work` - Work for WonderCash\n`/leaderboard` - View top earners',
                    inline: false
                },
                {
                    name: '🎮 Game Commands',
                    value: '`/coinflip` - Coin flip game\n`/dice` - Dice rolling game\n`/slots` - Slot machine',
                    inline: false
                },
                {
                    name: '📝 Introduction Commands',
                    value: '`/intro create` - Create introduction card\n`/intro view` - View introduction cards',
                    inline: false
                },
                {
                    name: '⚙️ Admin Commands',
                    value: '`/setup welcome` - Setup welcome system\n`/setup introduction` - Setup introduction channel',
                    inline: false
                },
                {
                    name: '💎 Exclusive Perks',
                    value: '**Server Boosters:** +50 daily, +25 work bonus\n**Premium Members:** +100 daily, +50 work bonus\n**Both:** Access to exclusive channels',
                    inline: false
                }
            )
            .setFooter({ text: 'Wonder Bot - Making Discord communities amazing!' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
}

module.exports = SlashHandlers;