import {CommandInteraction,MessageEmbed} from 'discord.js';
import {SlashCommandBuilder} from '@discordjs/builders';
import moment from 'moment';
const Logger = require('../lib/logger');
// Service
import MarketService from '../service/market.service';
import XivapiService from '../service/xivapi.service';
// Config
import Setting from '../definition/setting';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('시장')
        .setDescription('서버 기준으로 현재 시장에 등록되어 있는 특정 아이템의 목록을 조회합니다. (글로벌 전용)')
        .addStringOption(option =>
            option
                .setName('서버')
                .setDescription('서버 이름을 입력하세요.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('아이템이름')
                .setDescription('아이템의 이름을 입력하세요.')
                .setRequired(true)
        ),
    async execute(interaction: CommandInteraction) {
        const searchServer = interaction.options.getString('서버')?.toLowerCase() || '';
        const _originSearchWord = interaction.options.getString('아이템이름') || '';
        const searchWord = _originSearchWord.toLowerCase();


        try {
            await interaction.deferReply();

            let searchRes: any;

            if (/[가-힣]/gi.test(searchWord)) {
                await interaction.editReply('한국 서비스는 아직 지원하지 않아요!');
                return;
            }

            // 글로벌
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
            searchRes = await XivapiService.fetchElasticSearch('instantcontent', constSearchBody, 'ID,Name,IconHD');
            if (!searchRes.hasOwnProperty('data') || !searchRes.data.hasOwnProperty('Results')) {
                await interaction.editReply('정보를 불러오는 과정에서 오류가 발생했어요!');
                return;
            }
            if (Array.isArray(searchRes.data.Results) && searchRes.data.Results.length <= 0) {
                await interaction.editReply('데이터를 발견하지 못했어요!');
                return;
            }

            const results = searchRes.data.Results;

            let embedMsg: MessageEmbed;
            if (results.length > 1 && results[0].Name.toLowerCase() !== searchWord) {
                await interaction.editReply('아이템 검색 결과가 많아요! 이름을 정확하게 입력하고 다시 시도해보세요.');
                return;
            }

            // 시장 조회
            const itemId = results[0].ID;
            const currentList = await MarketService.fetchCurrentList(searchServer, itemId);
            if (!currentList.data.hasOwnProperty('listings') || currentList.data.listings.length < 1) {
                await interaction.editReply('시장에 등록된 아이템이 없어요.');
                return;
            }
            const total = currentList.data.listings.length;
            const lastUploadTime = moment(new Date(currentList.data.lastUploadTime)).format('YYYY년 MM월 DD일 HH시 mm분 ss초');

            let itemStr = '';
            for (let idx = 0; idx < total; idx++) {
                if (idx > 9) break;
                if (itemStr.length > 0) {
                    itemStr += "\n";
                }
                const item = currentList.data.listings[idx];

                itemStr += `${idx + 1}. ${item.quantity}개` +
                    (item.hq ? ' [HQ]' : '') +
                    (item.materia.length > 0 ? ' [마테리아 O]' : '') +
                    ` 총 ${item.total.toLocaleString()}길` +
                    ` (개당 ${item.pricePerUnit.toLocaleString()}길) -` +
                    ` By. ${item.retainerName}` +
                    (item.hasOwnProperty('worldName') ? ` (${item.worldName})` : '')
                ;
            }

            const historyTotal = currentList.data.recentHistory.length;
            let historyStr = '';
            for (let idx = 0; idx < historyTotal; idx++) {
                if (idx > 9) break;
                if (historyStr.length > 0) {
                    historyStr += "\n";
                }
                const item = currentList.data.recentHistory[idx];

                historyStr += `[${moment(new Date(item.timestamp * 1000)).format('YYYY/MM/DD HH:mm:ss')}] ${item.quantity}개` +
                    (item.hq ? ' [HQ]' : '') +
                    ` 총 ${item.total.toLocaleString()}길` +
                    ` (개당 ${item.pricePerUnit.toLocaleString()}길)\n` +
                    ` → ${item.buyerName} ${(item.hasOwnProperty('worldName') ? `(${item.worldName})` : '')} (이)가 구매`
                ;
            }

            embedMsg = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle(results[0].Name)
                .setDescription('상세한 정보를 보려면 위 링크를 클릭하세요.')
                .setURL(`https://universalis.app/market/${itemId}`)
                .addFields(
                    {name: `평균 시세`, value: `${currentList.data.averagePrice.toFixed(2).toLocaleString()}길`, inline: true},
                    {name: `최소 (NQ/HQ)`, value: `${currentList.data.minPriceNQ.toFixed(2).toLocaleString()}길 / ${currentList.data.minPriceHQ.toFixed(2).toLocaleString()}길`, inline: true},
                    {name: `최대 (NQ/HQ)`, value: `${currentList.data.maxPriceNQ.toFixed(2).toLocaleString()}길 / ${currentList.data.maxPriceHQ.toFixed(2).toLocaleString()}길`, inline: true},
                    {name: `시장 검색 결과 (총 ${total >= 100 ? '100건 이상' : `${total.toLocaleString()}건`})`, value: itemStr},
                    {name: `최근 구매 내역 (총 ${historyTotal >= 100 ? '100건 이상' : `${historyTotal.toLocaleString()}건`})`, value: historyStr},
                    {name: '마지막 갱신 날짜', value: `${lastUploadTime}`},
                )
                .setThumbnail(`https://xivapi.com${results[0].IconHD}`)
                .setTimestamp()
                .setFooter({
                    text: Setting.APP_NAME as string,
                });

            await interaction.editReply({embeds: [embedMsg]});
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