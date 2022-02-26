import {CommandInteraction, MessageEmbed} from 'discord.js';
import {SlashCommandBuilder} from '@discordjs/builders';
import Setting from "../shared/setting";
const Logger = require('../libs/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('음악현재')
        .setDescription('현재 재생중인 음악의 정보를 표시합니다.'),
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

            const song = queue.nowPlaying;
            const progressBar = queue.createProgressBar();
            const embedMsg: MessageEmbed = new MessageEmbed()
                .setColor('#eb8634')
                .setTitle(`${song.name}`)
                .setAuthor({
                    name: '지금 재생중'
                })
                .addFields(
                    { name: `올린이`, value: song.author, inline: true },
                    { name: `재생 시간`, value: song.duration, inline: true },
                    { name: `요청자`, value: song.requestedBy?.username || '' },
                )
                .setTimestamp(new Date())
                .setURL(song.url)
                .setThumbnail(song.thumbnail)
                .setFooter({
                    text: Setting.APP_NAME,
                });

            await interaction.editReply({ content: progressBar.prettier, embeds: [embedMsg] });
        }
        catch (e) {
            if (e instanceof Error) {
                await interaction.editReply('음악 정보 조회에서 오류가 발생했어요! 잠시 후에 다시 시도해보세요.');
                Logger.error(e.stack);
            } else {
                Logger.error(e);
            }
        }
    },
};