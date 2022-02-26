import {
    CommandInteraction,
    Message,
    MessageActionRow,
    MessageSelectMenu,
    SelectMenuInteraction
} from 'discord.js';
import {SlashCommandBuilder} from '@discordjs/builders';
import {RepeatMode} from 'discord-music-player';
const Logger = require('../libs/logger');

const types = [
    { label: '반복 안함', value: `${RepeatMode.DISABLED.valueOf()}`, type: RepeatMode.DISABLED },
    { label: '곡 반복', value: `${RepeatMode.SONG.valueOf()}`, type: RepeatMode.SONG },
    { label: '대기열 반복', value: `${RepeatMode.QUEUE.valueOf()}`, type: RepeatMode.QUEUE },
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('음악반복')
        .setDescription('현재 재생중인 음악의 반복 설정을 변경합니다.'),
    async selectExecute(interaction: SelectMenuInteraction) {
        const discordBot: any = interaction.client;

        try {
            await interaction.deferUpdate();

            const player = discordBot.player;
            const queue = player.getQueue(interaction.guildId);
            if (!queue) {
                await interaction.editReply({content:'음악을 다시 재생한 후에 진행해주세요.', components: []});
                return;
            }

            const selValue = interaction.values[0];
            let repeatName: string = '';
            for (const {label, value, type} of types) {
                if (value === selValue) {
                    queue.setRepeatMode(type);
                    repeatName = label;
                    break;
                }
            }

            if (repeatName == '') {
                throw new Error(`음악 반복 선택 시 데이터가 빈 값으로 넘어왔습니다.`);
            }

            await interaction.editReply({content: `음악 반복 상태를 \`${repeatName}\` 으로 변경했어요.`, components: []});
        }
        catch (e) {
            Logger.error('음악 반복 선택 과정에서 오류가 발생했습니다.', e);
            await interaction.editReply('오류가 발생해서 보여드릴 수 없네요.. 잠시 후에 다시 시도해보세요.');
        }
    },
    async execute(interaction: CommandInteraction) {
        const discordBot: any = interaction.client;

        try {
            await interaction.deferReply();

            const player = discordBot.player;
            const queue = player.getQueue(interaction.guildId);
            if (!queue) {
                await interaction.editReply({content:'먼저 음악을 재생한 후에 진행해주세요.', components: []});
                return;
            }

            const row = new MessageActionRow()
                .addComponents(
                    new MessageSelectMenu()
                        .setCustomId('music-loop').setPlaceholder('반복 타입을 선택해주세요')
                        .addOptions(types)
                );

            const editedMsg = await interaction.editReply({content: '반복 타입을 선택해주세요.', components: [row]});
            if (!(editedMsg instanceof Message)) return;

            setTimeout(async () => {
                const fetchMsg = await interaction.fetchReply();
                if (!(fetchMsg instanceof Message)) return;
                if (fetchMsg.editedTimestamp != null) return;

                await interaction.editReply({content: '시간이 꽤 지나서 다시 명령어를 이용해주세요.', components: []});
            }, 15000);
        }
        catch (e) {
            if (e instanceof Error) {
                await interaction.editReply('음악 반복 선택 과정에서 오류가 발생했어요! 잠시 후에 다시 시도해보세요.');
                Logger.error(e.stack);
            } else {
                Logger.error(e);
            }
        }
    },
};