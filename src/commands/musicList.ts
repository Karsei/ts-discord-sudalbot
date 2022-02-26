import {CommandInteraction, MessageEmbed} from 'discord.js';
import {SlashCommandBuilder} from '@discordjs/builders';
const Logger = require('../libs/logger');
// Config
import Setting from '../shared/setting';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('음악목록')
        .setDescription('현재 대기중인 음악 목록을 표시합니다.'),
    async execute(interaction: CommandInteraction) {
        const discordBot: any = interaction.client;

        try {
            await interaction.deferReply();

            const player = discordBot.player;
            const queue = player.getQueue(interaction.guildId);
            if (!queue) {
                await interaction.editReply('보여줄 목록이 없어요!');
                return;
            }

            let queueStr = '', idx = 1;
            for (const song of queue.songs) {
                if (idx >= 11) break;
                if (queueStr.length > 0) queueStr += "\n";
                queueStr += `${idx}. ${song.name}`;
            }
            const embedMsg: MessageEmbed = new MessageEmbed()
                .setColor('#eb8634')
                .setTitle(`현재 대기열 (총 ${queue.songs.length}개)`)
                .setDescription(queueStr)
                .setTimestamp(new Date())
                .setFooter({
                    text: Setting.APP_NAME,
                });

            await interaction.editReply({ embeds: [embedMsg] });
        }
        catch (e) {
            if (e instanceof Error) {
                await interaction.editReply('음악 목록을 표시하는 과정에서 오류가 발생했어요! 잠시 후에 다시 시도해보세요.');
                Logger.error(e.stack);
            } else {
                Logger.error(e);
            }
        }
    },
};