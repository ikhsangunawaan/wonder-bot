const { SlashCommandBuilder, REST, Routes } = require('discord.js');
require('dotenv').config();

const commands = [
    new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check your WonderCash balance')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to check balance for')
                .setRequired(false)),

    new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily WonderCash reward'),

    new SlashCommandBuilder()
        .setName('work')
        .setDescription('Work to earn WonderCash'),

    new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the WonderCash leaderboard'),

    new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Bet WonderCash on a coin flip')
        .addStringOption(option =>
            option.setName('choice')
                .setDescription('Heads or Tails')
                .setRequired(true)
                .addChoices(
                    { name: 'Heads', value: 'heads' },
                    { name: 'Tails', value: 'tails' }
                ))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount to bet (10-1000)')
                .setRequired(true)
                .setMinValue(10)
                .setMaxValue(1000)),

    new SlashCommandBuilder()
        .setName('dice')
        .setDescription('Roll dice and bet on the outcome')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount to bet (10-500)')
                .setRequired(true)
                .setMinValue(10)
                .setMaxValue(500)),

    new SlashCommandBuilder()
        .setName('slots')
        .setDescription('Play the slot machine')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount to bet (20-200)')
                .setRequired(true)
                .setMinValue(20)
                .setMaxValue(200)),

    new SlashCommandBuilder()
        .setName('intro')
        .setDescription('Create or view introduction cards')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create your introduction card'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View someone\'s introduction card')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to view introduction card for')
                        .setRequired(false))),

    new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup server settings (Admin only)')
        .addSubcommand(subcommand =>
            subcommand
                .setName('welcome')
                .setDescription('Setup welcome channel and message')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Welcome channel')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Welcome message')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('introduction')
                .setDescription('Setup introduction channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Introduction channel')
                        .setRequired(true))),

    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show bot commands and information'),

    new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Giveaway management commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('Start a new giveaway (Admin only)')
                .addStringOption(option =>
                    option.setName('duration')
                        .setDescription('Giveaway duration (e.g., 1h, 30m, 2d)')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('winners')
                        .setDescription('Number of winners')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(10))
                .addStringOption(option =>
                    option.setName('prize')
                        .setDescription('Prize description')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('Giveaway title')
                        .setRequired(false))
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to post giveaway in')
                        .setRequired(false))
                .addBooleanOption(option =>
                    option.setName('restrict_winners')
                        .setDescription('Restrict previous winners from entering')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('end')
                .setDescription('End a giveaway early (Admin only)')
                .addIntegerOption(option =>
                    option.setName('giveaway_id')
                        .setDescription('ID of the giveaway to end')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reroll')
                .setDescription('Reroll giveaway winners (Admin only)')
                .addIntegerOption(option =>
                    option.setName('giveaway_id')
                        .setDescription('ID of the giveaway to reroll')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List active giveaways'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('View giveaway statistics')
                .addIntegerOption(option =>
                    option.setName('giveaway_id')
                        .setDescription('ID of the giveaway to view stats for')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('wins')
                .setDescription('View your giveaway wins')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to check wins for')
                        .setRequired(false)))
];

async function deployCommands() {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        console.log('Started refreshing application (/) commands.');

        if (process.env.GUILD_ID) {
            // Guild-specific commands for development
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: commands }
            );
            console.log('Successfully reloaded guild application (/) commands.');
        } else {
            // Global commands for production
            await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands }
            );
            console.log('Successfully reloaded global application (/) commands.');
        }
    } catch (error) {
        console.error('Error deploying commands:', error);
    }
}

module.exports = { commands, deployCommands };