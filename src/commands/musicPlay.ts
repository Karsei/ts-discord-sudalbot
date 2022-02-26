import {CommandInteraction} from 'discord.js';
import {SlashCommandBuilder} from '@discordjs/builders';
const Logger = require('../libs/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('음악재생')
        .setDescription('음악을 재생합니다.')
        .addStringOption(option =>
            option
                .setName('주소')
                .setDescription('음악을 재생할 주소를 입력하세요.')
                .setRequired(true)
        ),
    async execute(interaction: CommandInteraction) {
        const url = interaction.options.getString('주소');
        const discordBot: any = interaction.client;

        try {
            await interaction.deferReply();

            const voiceChannel = interaction.guild?.members.cache.get(interaction.member?.user?.id || '')?.voice.channelId;
            if (voiceChannel && url) {
                const player = discordBot.player;
                const queue = player.createQueue(interaction.guildId, {
                    data: {
                        interaction: interaction
                    }
                });

                await queue.join(voiceChannel);

                let song;
                let isPlaylist = false;
                // 유튜브 - 재생목록
                if (/^.*youtube.*list=.*$/i.test(url)) {
                    isPlaylist = true;
                    song = await queue
                        .playlist(url, {
                            requestedBy: interaction.user
                        })
                        .catch((_: any) => {
                            if (!player.getQueue(interaction.guildId)) {
                                queue.stop();
                            }
                        });
                }
                // 일반
                else {
                    song = await queue
                        .play(url, {
                            requestedBy: interaction.user
                        })
                        .catch((_: any) => {
                            if (!player.getQueue(interaction.guildId)) {
                                queue.stop();
                            }
                        });
                }

                if (queue.isPlaying) {
                    await interaction.editReply(`\`${interaction.user.username}\` 님이 \`${song.name}\` 음악을 추가했어요.`);
                }
                else {
                    await interaction.editReply(`\`${interaction.user.username}\` 님이 방금 \`${song.name}\` ${isPlaylist ? '재생목록의 재생을 시작했어요.' : '음악 재생을 시작했어요.'}`);
                }
            }
        }
        catch (e) {
            if (e instanceof Error) {
                await interaction.editReply('음악을 재생하는 과정에서 오류가 발생했어요! 잠시 후에 다시 시도해보세요.');
                Logger.error(e.stack);
            } else {
                Logger.error(e);
            }
        }
    },
};