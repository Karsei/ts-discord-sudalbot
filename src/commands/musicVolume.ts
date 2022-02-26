import {CommandInteraction} from 'discord.js';
import {SlashCommandBuilder} from '@discordjs/builders';
const Logger = require('../libs/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('음악소리')
        .setDescription('현재 재생중인 음악의 소리 크기를 조절합니다.')
        .addIntegerOption(option =>
            option
                .setName('크기')
                .setDescription('0 ~ 200 사이의 숫자를 입력해주세요.')
                .setMinValue(0)
                .setMaxValue(200)
                .setRequired(true)
        ),
    async execute(interaction: CommandInteraction) {
        const amount = interaction.options.getInteger('크기');
        const discordBot: any = interaction.client;

        try {
            await interaction.deferReply();

            const player = discordBot.player;
            const queue = player.getQueue(interaction.guildId);
            if (!queue) {
                await interaction.editReply('현재 재생중인 음악이 없어요.');
                return;
            }

            if (!amount || amount < 0 || amount > 200) {
                await interaction.editReply('음악 소리는 0 에서 200 사이로 정해주세요.');
                return;
            }

            queue.setVolume(amount);
            await interaction.editReply(`음악 소리를 ${amount} 으로 변경했어요.`);
        }
        catch (e) {
            if (e instanceof Error) {
                await interaction.editReply('음악 소리를 변경하는 과정에서 오류가 발생했어요! 잠시 후에 다시 시도해보세요.');
                Logger.error(e.stack);
            } else {
                Logger.error(e);
            }
        }
    },
};