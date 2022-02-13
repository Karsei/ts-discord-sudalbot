import {CommandInteraction,MessageEmbed} from 'discord.js';
import {SlashCommandBuilder} from '@discordjs/builders';
import SnooWrap from 'snoowrap';
import RedditError from '../exceptions/RedditError';
const Logger = require('../libs/logger');
// Service
import XivApiFetchService from '../services/XivApiFetchService';
// Config
import Setting from '../shared/setting';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('아이템검색')
        .setDescription('아이템을 검색합니다.')
        .addStringOption(option =>
            option
                .setName('이름')
                .setDescription('아이템의 이름을 입력하세요.')
                .setRequired(true)
        ),
    async execute(interaction: CommandInteraction) {
        const searchWord = interaction.options.getString('이름')?.toLowerCase();

        try {
            await interaction.deferReply();

            const constSearchBody: object = {
                query: {
                    bool: {
                        should: [
                            {
                                wildcard: {
                                    'NameCombined_en': `*${searchWord}*`
                                }
                            },
                            {
                                wildcard: {
                                    'NameCombined_ja': `*${searchWord}*`
                                }
                            },
                            {
                                wildcard: {
                                    'NameCombined_fr': `*${searchWord}*`
                                }
                            },
                            {
                                wildcard: {
                                    'NameCombined_de': `*${searchWord}*`
                                }
                            }
                        ]
                    }
                },
                from: 0
            };
            const searchRes = await XivApiFetchService.fetchElasticSearch('instantcontent', constSearchBody, 'ID,Name');
            if (!searchRes.hasOwnProperty('data') || !searchRes.data.hasOwnProperty('Results')) {
                await interaction.editReply('정보를 불러오는 과정에서 오류가 발생했어요!');
                return;
            }
            if (Array.isArray(searchRes.data.Results) && searchRes.data.Results.length <= 0) {
                await interaction.editReply('데이터를 발견하지 못했어요!');
                return;
            }

            const pagination = searchRes.data.Pagination;
            const results = searchRes.data.Results;

            let embedMsg: MessageEmbed;
            if (results.length > 1 && results[0].Name.toLowerCase() !== searchWord) {
                let itmListstr = '';
                for (let itmIdx = 0, itmLen = results.length; itmIdx < itmLen; itmIdx++) {
                    if (itmListstr.length > 0) itmListstr += "\n";
                    itmListstr += `${itmIdx + 1}. ${results[itmIdx].Name}`;
                }
                embedMsg = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle(`아이템 검색`)
                    .setDescription(`상세 정보를 보려면 이름을 완전히 똑같이 해서 검색하세요.`)
                    .addFields(
                        { name: `"${searchWord}" 검색 결과 (총 ${pagination.ResultsTotal}개)`, value: itmListstr },
                    )
                    .setTimestamp(new Date())
                    .setFooter({
                        text: Setting.APP_NAME,
                    });
            }
            else {
                // 한 번 더 검색을 한다.
                let itemRes = await XivApiFetchService.fetchItem(results[0].ID);
                if (!itemRes.hasOwnProperty('data') || !itemRes.data.hasOwnProperty('Name')) {
                    await interaction.editReply('정보를 불러오는 과정에서 오류가 발생했어요!');
                    return;
                }

                const itemDetail = itemRes.data;
                embedMsg = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle(itemDetail.Name)
                    .setDescription(itemDetail.Description.replace(/(\r\n\t|\n|\r\t)/gm, " "))
                    .addFields(
                        { name: `아이템 이름`, value: `:flag_us: 영어: ${itemDetail.Name_en}\n:flag_jp: 일본어: ${itemDetail.Name_ja}\n:flag_kr: 한국어: (null)\n:flag_de: 독일어: ${itemDetail.Name_de}\n:flag_fr: 프랑스어: ${itemDetail.Name_fr}` },
                        { name: `아이템 레벨`, value: `${itemDetail.LevelItem}`, inline: true },
                        { name: `출시 버전`, value: `v${itemDetail.GamePatch.Version}`, inline: true },
                        { name: `고유번호`, value: `${itemDetail.ID}`, inline: true },
                        { name: `종류`, value: itemDetail.ItemUICategory.Name, inline: true },
                        { name: `아이템 분해`, value: itemDetail.Desynth === 0 ? '불가' : '가능', inline: true },
                        { name: `아이템 정제`, value: itemDetail.IsCollectable === 0 ? '불가' : '가능', inline: true },
                        { name: `DB 링크`, value: `[Lodestone](https://na.finalfantasyxiv.com/lodestone/playguide/db/search/?q=${itemDetail.Name_en.replace(' ', '+')})` +
                                `\n[Garland Tools](https://www.garlandtools.org/db/#item/${itemDetail.ID})` +
                                `\n[Teamcraft](https://ffxivteamcraft.com/db/ko/item/${itemDetail.ID})` +
                                `\n[타르토맛 타르트](https://ff14.tar.to/item/view/${itemDetail.ID})` +
                                `\n[Project Anyder](https://anyder.vercel.app/item/${itemDetail.ID})` +
                                `\n[Gamerescape](https://ffxiv.gamerescape.com/wiki/${itemDetail.Name_en.replace(/ /gm, "_")})` +
                                `\n[FF14 인벤](https://ff14.inven.co.kr/dataninfo/item/detail.php?code=${itemDetail.ID})`
                        },
                    )
                    .setThumbnail(`https://xivapi.com${itemDetail.IconHD}`)
                    .setTimestamp()
                    .setFooter({
                        text: Setting.APP_NAME,
                    });
            }

            await interaction.editReply({embeds: [embedMsg]});
        }
        catch (e) {
            if (e instanceof RedditError) {
                await interaction.editReply(e.message);
            } else if (e instanceof Error) {
                await interaction.editReply('오류가 발생해서 보여드릴 수 없네요.. 잠시 후에 다시 시도해보세요.');
                Logger.error(e.stack);
            } else {
                Logger.error(e);
            }
        }
    },
};