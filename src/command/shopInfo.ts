import {CommandInteraction, EmbedFieldData, MessageEmbed} from 'discord.js';
import {SlashCommandBuilder} from '@discordjs/builders';
const Logger = require('../lib/logger');
// Service
import SellInfoService from '../service/sell-info.service';
// Config
import Setting from '../definition/setting';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('상점')
        .setDescription('특정 아이템이 판매하는 곳의 정보를 보여줍니다.')
        .addStringOption(option =>
            option
                .setName('이름')
                .setDescription('아이템의 이름을 입력하세요.')
                .setRequired(true)
        ),
    async execute(interaction: CommandInteraction) {
        const searchWord = interaction.options.getString('이름')?.toLowerCase() || '';

        try {
            await interaction.deferReply();

            // 글로벌
            if (!/[가-힣]/gi.test(searchWord)) {
                await interaction.editReply('글로벌은 아직 지원하지 않아요. 조금만 더 기다려주세요.');
                return;
            }
            // 한국
            else {
                const itemUrl = await SellInfoService.withKoreaItemUrl(searchWord);
                if (itemUrl === '') {
                    await interaction.editReply('아이템을 찾을 수 없어요! 다시 검색해보세요.');
                    return;
                }

                const res = await SellInfoService.withKoreaItemInfo(itemUrl);

                const fields: EmbedFieldData[] = [];
                let getCount = 0;
                if (res.npc.length > 0) {
                    getCount++;
                    let str = '';
                    for (const item of res.npc) {
                        if (str.length > 0) {
                            str += "\n";
                        }
                        str += `${item.npcName} ~ ${item.location}`;
                    }
                    fields.push({
                        name: '판매 NPC',
                        value: str,
                    });
                }
                if (res.change.length > 0) {
                    getCount++;
                    let str = '';
                    for (const npc of res.change) {
                        if (str.length > 0) {
                            str += "\n";
                        }
                        str += `${npc.npcName} ~ ${npc.location}\n`;
                        for (const item of npc.items) {
                            str += `+ ${item.itemName} ${item.amount}개`;
                        }
                    }
                    fields.push({
                        name: '아이템으로 교환하기',
                        value: str,
                    });
                }
                if (res.changeGc.length > 0) {
                    getCount++;
                    let str = '';
                    for (const npc of res.changeGc) {
                        if (str.length > 0) {
                            str += "\n";
                        }
                        str += `${npc.npcName} ~ ${npc.location}\n`;
                        str += `+ ${npc.itemName} ${npc.amount}개 [${npc.grade}]`;
                    }
                    fields.push({
                        name: '군표로 교환하기',
                        value: str,
                    });
                }

                if (getCount <= 0) {
                    await interaction.editReply('판매하지 않는 아이템이에요.');
                    return;
                }

                const embedMsg = new MessageEmbed()
                    .setColor('#d9d1ba')
                    .setTitle(res.itemName)
                    .setURL(res.url)
                    .setDescription(`상세 정보를 보려면 위 링크를 클릭하세요.`)
                    .setThumbnail(res.iconUrl)
                    .addFields(fields)
                    .setTimestamp(new Date())
                    .setFooter({
                        text: Setting.APP_NAME as string,
                    });
                await interaction.editReply({embeds: [embedMsg]});
            }
        }
        catch (e) {
            if (e instanceof Error) {
                await interaction.editReply('오류가 발생해서 보여드릴 수 없네요.. 잠시 후에 다시 시도해보세요.');
                Logger.error(e.stack);
            } else {
                Logger.error(e);
            }
        }
    },
};