import {CommandInteraction} from 'discord.js';
import {SlashCommandBuilder} from '@discordjs/builders';
const Logger = require('../libs/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('음악일시중지')
        .setDescription('현재 재생중인 음악 재생을 일시중지하거나 재개합니다.'),
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

            if (!queue.paused) {
                queue.setPaused(true);
                await interaction.editReply('음악 재생을 잠시 중단했어요.');
            }
            else {
                queue.setPaused(false);
                await interaction.editReply('중단되었던 음악을 다시 재생할게요.');
            }
        }
        catch (e) {
            if (e instanceof Error) {
                await interaction.editReply('음악을 일시중지하거나 재개하는 과정에서 오류가 발생했어요! 잠시 후에 다시 시도해보세요.');
                Logger.error(e.stack);
            } else {
                Logger.error(e);
            }
        }
    },
};