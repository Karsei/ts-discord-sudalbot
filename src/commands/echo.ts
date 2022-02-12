import {CommandInteraction} from 'discord.js';
import {SlashCommandBuilder} from '@discordjs/builders';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('따라하기')
        .setDescription('봇이 사용자의 말을 똑같이 따라합니다.')
        .addStringOption(option =>
            option
                .setName('메세지')
                .setDescription('메세지를 입력하세요.')
                .setRequired(true)
        ),
    async execute(interaction: CommandInteraction) {
        const message = interaction.options.getString('메세지');
        await interaction.reply(`${message}`);
    },
};