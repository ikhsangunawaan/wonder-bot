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
        .setDescription('Show bot commands and information')
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