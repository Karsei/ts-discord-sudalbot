import {
    CommandInteraction,
    MessageActionRow,
    MessageSelectMenu,
    SelectMenuInteraction
} from 'discord.js';
import {SlashCommandBuilder} from '@discordjs/builders';
import RedisConnection from '../libs/redis';
import Logger from 'jet-logger';
// Service
import {WebhookCache} from '../services/NewsWebhookService';
// Config
import NewsCategories from '../shared/newsCategories';
import {NotifyCategory, Locales} from '../shared/locales';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('소식삭제')
        .setDescription('현재 서버에서 구독중인 소식 카테고리 중 하나를 삭제합니다.')
        .addStringOption(option =>
            option
                .setName('언어')
                .setDescription('언어를 입력하세요.')
                .setRequired(true)
                .addChoice('미국(영어)', 'na')
                .addChoice('일본(일본어)', 'jp')
                .addChoice('유럽(영어)', 'eu')
                .addChoice('독일(독일어)', 'de')
                .addChoice('프랑스(프랑스어)', 'fr')
                .addChoice('대한민국(한국어)', 'kr')
        ),
    async selectExecute(interaction: SelectMenuInteraction) {
        await interaction.deferUpdate();
        try {
            const hookUrl = await WebhookCache.getHookUrlByGuildId(interaction.guildId || '');
            const selectId = interaction.customId;

            const values = interaction.values[0].split("||");
            const locale = values[0], topic = values[1];
            
            await WebhookCache.delUrl(locale, topic, hookUrl);
            Logger.info(`${interaction.guild}(${interaction.guildId}) - 언어: ${locale}, 카테고리: ${topic} - 소식을 삭제하였습니다.`);
            await interaction.editReply({content: '소식 삭제에 성공했어요!', components: []});
        }
        catch (e) {
            Logger.err('소식 삭제 과정에서 오류가 발생했습니다.');
            if (e instanceof Error) {
                await interaction.editReply('오류가 발생해서 보여드릴 수 없네요.. 잠시 후에 다시 시도해보세요.');
                Logger.err(e.stack);
            } else {
                Logger.err(e);
            }
            console.error(e);
        }
    },
    async execute(interaction: CommandInteraction) {
        await interaction.deferReply();

        const selLocale = interaction.options.getString('언어');

        try
        {
            const redisCon = RedisConnection.instance();

            // 해당 서버의 Webhook URL 확인
            let hookUrl = await WebhookCache.getHookUrlByGuildId(interaction.guildId || '');
            if (!hookUrl) {
                await interaction.editReply('해당 디스코드 서버의 Webhook 을 찾지 못했어요!');
                return;
            }

            let res = [];
            let selectRes = [];

            let locales = Object.keys(Locales);
            let types = [...new Set([...Object.keys(NewsCategories.Global), ...Object.keys(NewsCategories.Korea)])];
            for (let localeIdx in locales) {
                if (locales[localeIdx] == selLocale) {
                    for (let typeIdx in types) {
                        let resCheck = await WebhookCache.checkInWebhook(locales[localeIdx], types[typeIdx], hookUrl);
                        if (resCheck) {
                            res.push({locale: locales[localeIdx], type: types[typeIdx]});
                            selectRes.push({
                                label: `${Locales[locales[localeIdx]].name} - ${NotifyCategory[types[typeIdx]].name}`,
                                value: `${locales[localeIdx]}||${types[typeIdx]}`
                            });
                        }
                    }
                }
            }

            if (res.length > 0) {
                let str = '';
                for (let resIdx in res) {
                    if (str.length > 0) {
                        str += "\n";
                    }
                    str += `${Locales[res[resIdx].locale].name} - ${NotifyCategory[res[resIdx].type].name}`;
                }

                const row = new MessageActionRow()
                    .addComponents(
                        new MessageSelectMenu()
                            .setCustomId('notify-delete').setPlaceholder('선택해주세요')
                            .addOptions(selectRes)
                    );
                await interaction.editReply({ content: '삭제할 소식을 선택해주세요.', components: [row] });
            } else {
                await interaction.editReply('존재하는 소식 알림이 없네요!');
            }
        }
        catch (e) {
            if (e instanceof Error) {
                await interaction.editReply('오류가 발생해서 보여드릴 수 없네요.. 잠시 후에 다시 시도해보세요.');
                Logger.err(e.stack);
            } else {
                Logger.err(e);
            }
        }
    },
};