const { Client, GatewayIntentBits, Collection, Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const database = require('./database');
const config = require('../config.json');
const CanvasUtils = require('./utils/canvas');
const { deployCommands } = require('./slash-commands');
const SlashHandlers = require('./slash-handlers');
const RoleManager = require('./role-manager');

// Load environment variables
require('dotenv').config();

class WonderBot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessageReactions
            ]
        });

        this.commands = new Collection();
        this.slashCommands = new Collection();
        this.canvas = new CanvasUtils();
        this.slashHandlers = new SlashHandlers();
        this.roleManager = new RoleManager(this.client);
        
        this.setupEventHandlers();
        this.loadCommands();
        this.loadSlashCommands();
    }

    setupEventHandlers() {
        this.client.once(Events.ClientReady, async () => {
            console.log(`✅ Wonder Bot is ready! Logged in as ${this.client.user.tag}`);
            this.client.user.setActivity('w.help | Managing WonderCash 💰', { type: 'WATCHING' });
            
            // Deploy slash commands
            await deployCommands();
        });

        this.client.on(Events.MessageCreate, this.handleMessage.bind(this));
        this.client.on(Events.InteractionCreate, this.handleInteraction.bind(this));
        this.client.on(Events.GuildMemberAdd, this.handleMemberJoin.bind(this));
        this.client.on(Events.GuildMemberUpdate, this.handleMemberUpdate.bind(this));
    }

    async handleMessage(message) {
        if (message.author.bot || !message.content.startsWith(config.prefix)) return;

        const args = message.content.slice(config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = this.commands.get(commandName) || this.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        if (!command) return;

        try {
            // Ensure user exists in database
            await database.createUser(message.author.id, message.author.username);
            await command.execute(message, args, this);
        } catch (error) {
            console.error('Error executing command:', error);
            message.reply('❌ There was an error executing that command!');
        }
    }

    async handleInteraction(interaction) {
        if (interaction.isChatInputCommand()) {
            try {
                await database.createUser(interaction.user.id, interaction.user.username);
                
                // Route to appropriate handler
                switch (interaction.commandName) {
                    case 'balance':
                        await this.slashHandlers.handleBalance(interaction);
                        break;
                    case 'daily':
                        await this.slashHandlers.handleDaily(interaction);
                        break;
                    case 'work':
                        await this.slashHandlers.handleWork(interaction);
                        break;
                    case 'leaderboard':
                        await this.slashHandlers.handleLeaderboard(interaction);
                        break;
                    case 'coinflip':
                        await this.slashHandlers.handleCoinflip(interaction);
                        break;
                    case 'dice':
                        await this.slashHandlers.handleDice(interaction);
                        break;
                    case 'slots':
                        await this.slashHandlers.handleSlots(interaction);
                        break;
                    case 'intro':
                        // Pass bot instance for modal handling
                        interaction.bot = this;
                        await this.slashHandlers.handleIntro(interaction);
                        break;
                    case 'setup':
                        await this.slashHandlers.handleSetup(interaction);
                        break;
                    case 'help':
                        await this.slashHandlers.handleHelp(interaction);
                        break;
                }
            } catch (error) {
                console.error('Error executing slash command:', error);
                await interaction.reply({ content: '❌ There was an error executing that command!', ephemeral: true });
            }
        } else if (interaction.isButton()) {
            await this.handleButtonInteraction(interaction);
        } else if (interaction.isModalSubmit()) {
            await this.handleModalSubmit(interaction);
        }
    }

    async handleButtonInteraction(interaction) {
        const [action, ...params] = interaction.customId.split('_');

        switch (action) {
            case 'intro':
                await this.showIntroductionModal(interaction);
                break;
            case 'coinflip':
                await this.handleCoinflipGame(interaction, params[0], parseInt(params[1]));
                break;
            case 'dice':
                await this.handleDiceGame(interaction, parseInt(params[0]));
                break;
            case 'slots':
                await this.handleSlotsGame(interaction, parseInt(params[0]));
                break;
        }
    }

    async handleModalSubmit(interaction) {
        if (interaction.customId === 'introduction_modal') {
            await this.processIntroductionForm(interaction);
        }
    }

    async handleMemberJoin(member) {
        const settings = await database.getServerSettings(member.guild.id);
        if (!settings || !settings.welcome_channel) return;

        const welcomeChannel = member.guild.channels.cache.get(settings.welcome_channel);
        if (!welcomeChannel) return;

        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setTitle('🎉 Welcome to the server!')
            .setDescription(`Hey ${member}, welcome to **${member.guild.name}**!\n\n${settings.welcome_message || 'We\'re glad to have you here!'}`)
            .setThumbnail(member.user.displayAvatarURL())
            .setFooter({ text: 'Wonder Bot', iconURL: this.client.user.displayAvatarURL() })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('intro_create')
                    .setLabel('Create Introduction Card')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📝')
            );

        await welcomeChannel.send({ embeds: [embed], components: [row] });
        
        // Create user in database
        await database.createUser(member.id, member.user.username);
        
        // Auto-assign roles if applicable
        await this.roleManager.autoAssignRoles(member);
    }

    async handleMemberUpdate(oldMember, newMember) {
        // Handle role updates
        await this.roleManager.handleRoleUpdate(oldMember, newMember);
    }

    async showIntroductionModal(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('introduction_modal')
            .setTitle('Create Your Introduction Card');

        const nameInput = new TextInputBuilder()
            .setCustomId('name')
            .setLabel('Your Name')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(50);

        const ageInput = new TextInputBuilder()
            .setCustomId('age')
            .setLabel('Your Age')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(3);

        const locationInput = new TextInputBuilder()
            .setCustomId('location')
            .setLabel('Your Location')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(100);

        const hobbiesInput = new TextInputBuilder()
            .setCustomId('hobbies')
            .setLabel('Hobbies & Interests')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(200);

        const bioInput = new TextInputBuilder()
            .setCustomId('bio')
            .setLabel('About You')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(300);

        const colorInput = new TextInputBuilder()
            .setCustomId('color')
            .setLabel('Favorite Color (hex code, e.g., #7C3AED)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(7);

        modal.addComponents(
            new ActionRowBuilder().addComponents(nameInput),
            new ActionRowBuilder().addComponents(ageInput),
            new ActionRowBuilder().addComponents(locationInput),
            new ActionRowBuilder().addComponents(hobbiesInput),
            new ActionRowBuilder().addComponents(bioInput)
        );

        await interaction.showModal(modal);
    }

    async processIntroductionForm(interaction) {
        const name = interaction.fields.getTextInputValue('name');
        const age = parseInt(interaction.fields.getTextInputValue('age'));
        const location = interaction.fields.getTextInputValue('location');
        const hobbies = interaction.fields.getTextInputValue('hobbies');
        const bio = interaction.fields.getTextInputValue('bio');
        const favoriteColor = interaction.fields.getTextInputValue('color') || '#7C3AED';

        if (isNaN(age) || age < 1 || age > 150) {
            return await interaction.reply({ content: '❌ Please enter a valid age!', ephemeral: true });
        }

        try {
            // Save to database
            await database.saveIntroCard({
                userId: interaction.user.id,
                name,
                age,
                location,
                hobbies,
                favoriteColor,
                bio
            });

            // Generate image
            const cardBuffer = await this.canvas.createIntroductionCard(interaction.user, {
                name, age, location, hobbies, favorite_color: favoriteColor, bio
            });

            const attachment = new AttachmentBuilder(cardBuffer, { name: 'introduction.png' });

            const embed = new EmbedBuilder()
                .setColor(favoriteColor)
                .setTitle('📝 New Introduction Card!')
                .setDescription(`Welcome ${name} to our community!`)
                .setImage('attachment://introduction.png')
                .setFooter({ text: 'Wonder Bot', iconURL: this.client.user.displayAvatarURL() })
                .setTimestamp();

            // Send to introduction channel
            const introChannel = interaction.guild.channels.cache.get(process.env.INTRODUCTION_CHANNEL_ID);
            if (introChannel) {
                await introChannel.send({ embeds: [embed], files: [attachment] });
            }

            // Reward user with WonderCash
            await database.updateBalance(interaction.user.id, 200);
            await database.addTransaction(interaction.user.id, 'intro_reward', 200, 'Introduction card creation reward');

            await interaction.reply({ 
                content: `✅ Your introduction card has been created and posted! You earned 200 ${config.currency.symbol} ${config.currency.name}!`, 
                ephemeral: true 
            });

        } catch (error) {
            console.error('Error creating introduction card:', error);
            await interaction.reply({ content: '❌ There was an error creating your introduction card!', ephemeral: true });
        }
    }

    loadCommands() {
        // Economy commands
        this.addCommand('balance', {
            description: 'Check your WonderCash balance',
            aliases: ['bal', 'money'],
            execute: async (message, args, bot) => {
                const targetUser = message.mentions.users.first() || message.author;
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

                await message.reply({ embeds: [embed] });
            }
        });

        this.addCommand('daily', {
            description: 'Claim your daily WonderCash',
            execute: async (message, args, bot) => {
                const user = await database.getUser(message.author.id);
                const now = new Date();
                const lastClaimed = user.daily_last_claimed ? new Date(user.daily_last_claimed) : null;

                if (lastClaimed && now - lastClaimed < 24 * 60 * 60 * 1000) {
                    const timeLeft = 24 * 60 * 60 * 1000 - (now - lastClaimed);
                    const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
                    const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
                    
                    return await message.reply(`⏰ You can claim your daily reward in ${hoursLeft}h ${minutesLeft}m!`);
                }

                let amount = config.currency.dailyAmount;
                
                // Check for booster/premium bonuses
                const member = message.guild.members.cache.get(message.author.id);
                if (member.roles.cache.has(process.env.BOOSTER_ROLE_ID)) {
                    amount += config.booster.dailyBonus;
                }
                if (member.roles.cache.has(process.env.PREMIUM_ROLE_ID)) {
                    amount += config.premium.dailyBonus;
                }

                await database.updateBalance(message.author.id, amount);
                await database.updateDailyClaim(message.author.id);
                await database.addTransaction(message.author.id, 'daily', amount, 'Daily reward claimed');

                const embed = new EmbedBuilder()
                    .setColor(config.colors.success)
                    .setTitle('💰 Daily Reward Claimed!')
                    .setDescription(`You received **${amount}** ${config.currency.symbol} ${config.currency.name}!`)
                    .setFooter({ text: 'Come back tomorrow for another reward!' })
                    .setTimestamp();

                await message.reply({ embeds: [embed] });
            }
        });

        this.addCommand('work', {
            description: 'Work to earn WonderCash',
            execute: async (message, args, bot) => {
                const user = await database.getUser(message.author.id);
                const now = new Date();
                const lastWorked = user.work_last_used ? new Date(user.work_last_used) : null;

                if (lastWorked && now - lastWorked < 60 * 60 * 1000) {
                    const timeLeft = 60 * 60 * 1000 - (now - lastWorked);
                    const minutesLeft = Math.floor(timeLeft / (60 * 1000));
                    
                    return await message.reply(`⏰ You can work again in ${minutesLeft} minutes!`);
                }

                const jobs = [
                    'delivered packages', 'coded a website', 'taught a class', 'wrote articles',
                    'designed graphics', 'managed social media', 'fixed computers', 'cooked meals',
                    'cleaned offices', 'walked dogs', 'painted houses', 'tutored students'
                ];

                let baseAmount = config.currency.workAmount;
                const randomMultiplier = Math.random() * 0.5 + 0.75; // 0.75x to 1.25x
                let amount = Math.floor(baseAmount * randomMultiplier);

                // Check for booster/premium bonuses
                const member = message.guild.members.cache.get(message.author.id);
                if (member.roles.cache.has(process.env.BOOSTER_ROLE_ID)) {
                    amount += config.booster.workBonus;
                }
                if (member.roles.cache.has(process.env.PREMIUM_ROLE_ID)) {
                    amount += config.premium.workBonus;
                }

                const randomJob = jobs[Math.floor(Math.random() * jobs.length)];

                await database.updateBalance(message.author.id, amount);
                await database.updateWorkClaim(message.author.id);
                await database.addTransaction(message.author.id, 'work', amount, `Worked: ${randomJob}`);

                const embed = new EmbedBuilder()
                    .setColor(config.colors.success)
                    .setTitle('💼 Work Complete!')
                    .setDescription(`You ${randomJob} and earned **${amount}** ${config.currency.symbol} ${config.currency.name}!`)
                    .setFooter({ text: 'You can work again in 1 hour!' })
                    .setTimestamp();

                await message.reply({ embeds: [embed] });
            }
        });

        this.addCommand('leaderboard', {
            description: 'View the WonderCash leaderboard',
            aliases: ['lb', 'top'],
            execute: async (message, args, bot) => {
                const topUsers = await database.getTopUsers(10);
                
                if (topUsers.length === 0) {
                    return await message.reply('📊 No users found in the leaderboard yet!');
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

                await message.reply({ embeds: [embed] });
            }
        });

        // Game commands
        this.addCommand('coinflip', {
            description: 'Bet WonderCash on a coin flip',
            aliases: ['cf'],
            execute: async (message, args, bot) => {
                if (!args[0] || !args[1]) {
                    return await message.reply('❌ Usage: `w.coinflip <heads/tails> <amount>`');
                }

                const choice = args[0].toLowerCase();
                const amount = parseInt(args[1]);

                if (!['heads', 'tails'].includes(choice)) {
                    return await message.reply('❌ Choose either `heads` or `tails`!');
                }

                if (isNaN(amount) || amount < config.games.coinflip.minBet || amount > config.games.coinflip.maxBet) {
                    return await message.reply(`❌ Bet amount must be between ${config.games.coinflip.minBet} and ${config.games.coinflip.maxBet} ${config.currency.symbol}!`);
                }

                const user = await database.getUser(message.author.id);
                if (user.balance < amount) {
                    return await message.reply(`❌ You don't have enough ${config.currency.name}! Your balance: ${user.balance} ${config.currency.symbol}`);
                }

                const result = Math.random() < 0.5 ? 'heads' : 'tails';
                const won = choice === result;
                const winAmount = won ? amount : -amount;

                await database.updateBalance(message.author.id, winAmount);
                await database.addTransaction(message.author.id, 'coinflip', winAmount, `Coinflip ${won ? 'win' : 'loss'}: ${choice} vs ${result}`);

                const embed = new EmbedBuilder()
                    .setColor(won ? config.colors.success : config.colors.error)
                    .setTitle('🪙 Coin Flip Result')
                    .setDescription(`The coin landed on **${result}**!\n\n${won ? '🎉 You won!' : '😔 You lost!'}\n**${won ? '+' : ''}${winAmount}** ${config.currency.symbol} ${config.currency.name}`)
                    .setFooter({ text: `Your balance: ${user.balance + winAmount} ${config.currency.symbol}` })
                    .setTimestamp();

                await message.reply({ embeds: [embed] });
            }
        });

        this.addCommand('dice', {
            description: 'Roll dice and bet on the outcome',
            execute: async (message, args, bot) => {
                if (!args[0]) {
                    return await message.reply('❌ Usage: `w.dice <amount>`');
                }

                const amount = parseInt(args[0]);

                if (isNaN(amount) || amount < config.games.dice.minBet || amount > config.games.dice.maxBet) {
                    return await message.reply(`❌ Bet amount must be between ${config.games.dice.minBet} and ${config.games.dice.maxBet} ${config.currency.symbol}!`);
                }

                const user = await database.getUser(message.author.id);
                if (user.balance < amount) {
                    return await message.reply(`❌ You don't have enough ${config.currency.name}! Your balance: ${user.balance} ${config.currency.symbol}`);
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

                await database.updateBalance(message.author.id, winAmount);
                await database.addTransaction(message.author.id, 'dice', winAmount, `Dice roll: ${dice1}+${dice2}=${total}`);

                const embed = new EmbedBuilder()
                    .setColor(winAmount > 0 ? config.colors.success : config.colors.error)
                    .setTitle('🎲 Dice Roll Result')
                    .setDescription(`🎲 ${dice1} + ${dice2} = **${total}**\n\n${result}\n**${winAmount >= 0 ? '+' : ''}${winAmount}** ${config.currency.symbol} ${config.currency.name}`)
                    .setFooter({ text: `Your balance: ${user.balance + winAmount} ${config.currency.symbol}` })
                    .setTimestamp();

                await message.reply({ embeds: [embed] });
            }
        });

        this.addCommand('slots', {
            description: 'Play the slot machine',
            execute: async (message, args, bot) => {
                if (!args[0]) {
                    return await message.reply('❌ Usage: `w.slots <amount>`');
                }

                const amount = parseInt(args[0]);

                if (isNaN(amount) || amount < config.games.slots.minBet || amount > config.games.slots.maxBet) {
                    return await message.reply(`❌ Bet amount must be between ${config.games.slots.minBet} and ${config.games.slots.maxBet} ${config.currency.symbol}!`);
                }

                const user = await database.getUser(message.author.id);
                if (user.balance < amount) {
                    return await message.reply(`❌ You don't have enough ${config.currency.name}! Your balance: ${user.balance} ${config.currency.symbol}`);
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

                await database.updateBalance(message.author.id, winAmount);
                await database.addTransaction(message.author.id, 'slots', winAmount, `Slots: ${reel1}${reel2}${reel3}`);

                const embed = new EmbedBuilder()
                    .setColor(winAmount > 0 ? config.colors.success : config.colors.error)
                    .setTitle('🎰 Slot Machine')
                    .setDescription(`${reel1} | ${reel2} | ${reel3}\n\n${result}\n**${winAmount >= 0 ? '+' : ''}${winAmount}** ${config.currency.symbol} ${config.currency.name}`)
                    .setFooter({ text: `Your balance: ${user.balance + winAmount} ${config.currency.symbol}` })
                    .setTimestamp();

                await message.reply({ embeds: [embed] });
            }
        });

        // Role and perks commands
        this.addCommand('perks', {
            description: 'View your role perks and bonuses',
            execute: async (message, args, bot) => {
                const member = message.guild.members.cache.get(message.author.id);
                const embed = bot.roleManager.createPerksEmbed(member);
                await message.reply({ embeds: [embed] });
            }
        });

        // Utility commands
        this.addCommand('help', {
            description: 'Show all available commands',
            execute: async (message, args, bot) => {
                const embed = new EmbedBuilder()
                    .setColor(config.colors.primary)
                    .setTitle('🤖 Wonder Bot Commands')
                    .setDescription('Here are all the available commands:')
                    .addFields(
                        {
                            name: '💰 Economy Commands',
                            value: '`w.balance` - Check WonderCash balance\n`w.daily` - Claim daily reward\n`w.work` - Work for WonderCash\n`w.leaderboard` - View top earners',
                            inline: false
                        },
                        {
                            name: '🎮 Game Commands',
                            value: '`w.coinflip <heads/tails> <amount>` - Coin flip game\n`w.dice <amount>` - Dice rolling game\n`w.slots <amount>` - Slot machine',
                            inline: false
                        },
                        {
                            name: '💎 Role Commands',
                            value: '`w.perks` - View your role perks and bonuses',
                            inline: false
                        },
                        {
                            name: '📝 Other Features',
                            value: '• Introduction cards with `/intro` slash command\n• Welcome messages for new members\n• Exclusive perks for boosters and premium members',
                            inline: false
                        }
                    )
                    .setFooter({ text: 'Wonder Bot - Making Discord communities amazing!' })
                    .setTimestamp();

                await message.reply({ embeds: [embed] });
            }
        });
    }

    loadSlashCommands() {
        // Slash commands are loaded dynamically in the handler
        console.log('✅ Slash commands loaded successfully');
    }

    addCommand(name, command) {
        this.commands.set(name, command);
    }

    async start() {
        try {
            await this.client.login(process.env.DISCORD_TOKEN);
        } catch (error) {
            console.error('Error starting bot:', error);
        }
    }
}

// Create and start the bot
const bot = new WonderBot();
bot.start();