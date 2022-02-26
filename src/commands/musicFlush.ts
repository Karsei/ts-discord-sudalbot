import {CommandInteraction} from 'discord.js';
import {SlashCommandBuilder} from '@discordjs/builders';
const Logger = require('../libs/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('음악초기화')
        .setDescription('현재의 음악 대기열을 모두 초기화합니다.'),
    async execute(interaction: CommandInteraction) {
        const discordBot: any = interaction.client;

        try {
            await interaction.deferReply();

            const player = discordBot.player;
            const queue = player.getQueue(interaction.guildId);
            if (!queue) {
                await interaction.editReply('현재 재생중인 음악이 없어요.');
                return;
            }

            queue.clearQueue();
            await interaction.editReply('대기열을 초기화했어요.');
        }
        catch (e) {
            if (e instanceof Error) {
                await interaction.editReply('음악 대기열을 초기화하는 과정에서 오류가 발생했어요! 잠시 후에 다시 시도해보세요.');
                Logger.error(e.stack);
            } else {
                Logger.error(e);
            }
        }
    },
};