import {
    CommandInteraction, Message,
    MessageActionRow,
    MessageSelectMenu, Permissions,
    SelectMenuInteraction
} from 'discord.js';
import {SlashCommandBuilder} from '@discordjs/builders';
const Logger = require('../lib/logger');
// Config
import NewsCategories from '../definition/newsCategories';
import {NotifyCategory, Locales} from '../definition/locales';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('소식추가')
        .setDescription('현재 서버에서 구독중인 소식 카테고리 중 하나를 추가합니다.')
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
        try {
            const discordBot: any = interaction.client;

            const roles = interaction.member?.permissions;
            if (roles instanceof Permissions) {
                if (!roles.has([Permissions.FLAGS.ADMINISTRATOR, Permissions.FLAGS.MANAGE_MESSAGES])) {
                    await interaction.editReply('관리자 또는 메세지 관리 권한이 없어서 이용할 수 없어요.');
                    return;
                }
            }
            else {
                await interaction.editReply('알 수 없는 오류가 발생했어요! 개발자에게 문의해주세요.');
                return;
            }

            await interaction.deferUpdate();

            const hookUrl = await this.discordBot.service.web.getHookUrlByGuildId(interaction.guildId || '');
            const selectId = interaction.customId;

            const values = interaction.values[0].split("||");
            const locale = values[0], topic = values[1];

            await discordBot.redis.addUrl(locale, topic, hookUrl);
            Logger.info(`${interaction.guild} (${interaction.guildId}) - 언어: ${locale}, 카테고리: ${topic} - 소식을 추가하였습니다.`);
            await interaction.editReply({content: '소식 추가에 성공했어요!', components: []});
        }
        catch (e) {
            Logger.error('소식 추가 과정에서 오류가 발생했습니다.', e);
            await interaction.editReply('오류가 발생해서 보여드릴 수 없네요.. 잠시 후에 다시 시도해보세요.');
        }
    },
    async execute(interaction: CommandInteraction) {
        const selLocale = interaction.options.getString('언어');

        try
        {
            const discordBot: any = interaction.client;

            const roles = interaction.member?.permissions;
            if (roles instanceof Permissions) {
                if (!roles.has([Permissions.FLAGS.ADMINISTRATOR, Permissions.FLAGS.MANAGE_MESSAGES])) {
                    await interaction.editReply('관리자 또는 메세지 관리 권한이 없어서 이용할 수 없어요.');
                    return;
                }
            }
            else {
                await interaction.editReply('알 수 없는 오류가 발생했어요! 개발자에게 문의해주세요.');
                return;
            }

            await interaction.deferReply({ephemeral: true});

            // 해당 서버의 Webhook URL 확인
            let hookUrl = await discordBot.redis.getHookUrlByGuildId(interaction.guildId || '');
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
                        let resCheck = await discordBot.redis.checkInWebhook(locales[localeIdx], types[typeIdx], hookUrl);
                        if (!resCheck) {
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
                            .setCustomId('notify-create').setPlaceholder('선택해주세요')
                            .addOptions(selectRes)
                    );
                const editedMsg = await interaction.editReply({content: '추가할 소식을 선택해주세요.', components: [row]});
                if (!(editedMsg instanceof Message)) return;

                setTimeout(async () => {
                    const fetchMsg = await interaction.fetchReply();
                    if (!(fetchMsg instanceof Message)) return;
                    if (fetchMsg.editedTimestamp != null) return;

                    await interaction.editReply({content: '시간이 꽤 지나서 다시 명령어를 이용해주세요.', components: []});
                }, 15000);
            } else {
                await interaction.editReply('존재하는 소식 알림이 없어요!');
            }
        }
        catch (e) {
            if (e instanceof Error) {
                Logger.error(e.stack);
                await interaction.editReply('오류가 발생해서 보여드릴 수 없네요.. 잠시 후에 다시 시도해보세요.');
            } else {
                Logger.error(e);
            }
        }
    },
};