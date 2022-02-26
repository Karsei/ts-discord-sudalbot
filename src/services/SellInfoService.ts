import axios from 'axios';
import cheerio, {CheerioAPI} from 'cheerio';
// Config
const Logger = require('../libs/logger');

const DB_KOREA = 'https://guide.ff14.co.kr';

export default class SellInfoService
{
    static async withGlobalItemUrl() {

    }

    static async withKoreaItemUrl(pSearchWord: string) {
        const searchUrl = `${DB_KOREA}/lodestone/search?keyword=${encodeURIComponent(pSearchWord)}`;
        const listData = await axios.get(searchUrl);
        const oListData = cheerio.load(listData.data);
        return ItemInfoParser.parseListWithKorea(oListData, pSearchWord);
    }

    static async withKoreaItemInfo(pItemUrl: string) {
        const itemUrl = `${DB_KOREA}${pItemUrl}`;
        const itemData = await axios.get(itemUrl);
        const oItemData = cheerio.load(itemData.data);
        return ItemInfoParser.parseInfoWithKorea(oItemData, itemUrl);
    }
}

class ItemInfoParser
{
    static parseListWithKorea($: CheerioAPI, pSearchWord: string): string {
        const $base = $('.base_tb');
        const $list = $base.find('table tbody tr');
        let list = '';
        if ($list && $list.length > 0) {
            $list.each(function () {
                const $item = $(this).find('td:first');
                const $a = $item.find('a');
                const text = $a.text(), url: string = $a.attr('href') || '';
                if (text.toLowerCase() === pSearchWord.toLowerCase()) {
                    list = url;
                    return false;
                }
            });
        }
        return list;
    }

    static parseInfoWithKorea($: CheerioAPI, pItemUrl: string) {
        const result: any = {
            url: pItemUrl,              // 링크
            iconUrl: '',                // 아이콘
            itemName: '',               // 아이템 이름
            npc: [],                    // 판매 NPC
            get: [],                    // 입수 가능한 아이템
            change: [],                 // 교환에 필요한 아이템
            changeGc: [],               // 교환에 필요한 군표 & 계급
            changeNpc: [],              // 교환 NPC
            recipeCraft: [],            // 관련 제작물
        };

        // 아이콘 이미지
        result.iconUrl = 'https:' + $('.cont_wrap .view_header .view_icon img:eq(0)').attr('src') || '';

        // 아이템 이름
        result.itemName = $('.cont_wrap .view_header .view_name h1').text().trim();

        // 판매 NPC
        const $mainBase = $('div.view_base.add_box');
        const $mainContainer = $mainBase.find('h2');
        if ($mainContainer.length > 0) {
            if ($mainContainer.text() === '판매 NPC') {
                const $npcSellList = $mainBase.find('ul li');
                if ($npcSellList.length > 0) {
                    $npcSellList.each(function () {
                        result.npc.push({
                            npcName: $(this).find('div.left_side a').text(),
                            location: $(this).find('div.right_side p').text(),
                        });
                    });
                }
            }
            else if ($mainContainer.text() === '입수 가능한 아이템') {
                const $getList = $mainBase.find('ul li');
                if ($getList.length > 0) {
                    $getList.each(function () {
                        result.get.push({
                            itemName: $(this).find('div.left_side p').text(),
                        });
                    });
                }
            }
        }

        // 교환 NPC
        const $changeBase = $('div.view_base_tb');
        if ($changeBase.length > 0) {
            $changeBase.each(function() {
                const $changeTitle = $(this).find('h2');
                if ($changeTitle.text() === '교환에 필요한 아이템') {
                    const $changeList = $(this).find('table');
                    if ($changeList.length > 0) {
                        $changeList.each(function () {
                            const items = [];

                            const $changeItem = $(this).find('tbody');
                            if ($changeItem.find('tr:eq(0) td:eq(0)').length > 0) {
                                const name = $changeItem.find('tr:eq(0) td:eq(0) p span:eq(0)').text();
                                if (name) {
                                    items.push({
                                        itemName: $changeItem.find('tr:eq(0) td:eq(0) p span:eq(0)').text(),
                                        amount: $changeItem.find('tr:eq(0) td:eq(0) p span:eq(1)').text(),
                                    });
                                }
                            }
                            if ($changeItem.find('tr:eq(0) td:eq(1)').length > 0) {
                                const name = $changeItem.find('tr:eq(0) td:eq(1) p span:eq(0)').text();
                                if (name) {
                                    items.push({
                                        itemName: $changeItem.find('tr:eq(0) td:eq(1) p span:eq(0)').text(),
                                        amount: $changeItem.find('tr:eq(0) td:eq(1) p span:eq(1)').text(),
                                    });
                                }
                            }
                            const npcName = $changeItem.find('tr:eq(1) td p a').text();
                            let locationNode: any = $changeItem.find('tr:eq(1) td p')
                                .contents()
                                .filter(function () {
                                    return this.nodeType == 3;
                                })[0];
                            const location: string = locationNode.nodeValue;

                            result.change.push({
                                items: items,
                                npcName: npcName,
                                location: location,
                            });
                        });
                    }
                }
                else if ($changeTitle.text() === '교환에 필요한 군표 & 계급') {
                    // 코크스
                    const $changeList = $(this).find('table');
                    if ($changeList.length > 0) {
                        $changeList.each(function () {
                            const $changeItem = $(this).find('tbody');
                            const _gil = $changeItem.find('tr:eq(0) td:eq(0)').text().trim();
                            const _grade = $changeItem.find('tr:eq(0) td:eq(1)').text().trim();
                            const npcName = $changeItem.find('tr:eq(1) td p a').text();
                            let locationNode: any = $changeItem.find('tr:eq(1) td p')
                                .contents()
                                .filter(function () {
                                    return this.nodeType == 3;
                                })[0];
                            const location: string = locationNode.nodeValue;

                            result.changeGc.push({
                                itemName: '군표',
                                amount: _gil,
                                grade: _grade,
                                npcName: npcName,
                                location: location,
                            });
                        });
                    }
                }
            });
        }

        // 교환 관련 NPC
        const $changeNpcBase = $('div.view_base_tb.add_box');
        if ($changeNpcBase.length > 0) {
            const $changeNpcTitle = $changeNpcBase.find('h2');
            if ($changeNpcTitle.text() === '교환 관련 NPC') {
                const $changeList = $changeNpcBase.find('table tbody tr');
                if ($changeList.length > 0) {
                    $changeList.each(function () {
                        const npcName = $(this).find('td:eq(0) a').text();
                        const location = $(this).find('td:eq(1)').text();

                        result.changeNpc.push({
                            npcName: npcName,
                            location: location,
                        });
                    });
                }
            }
        }

        // 기타
        const $etcBase = $('div.cont_in.cont_info div.info_box');
        if ($etcBase.length > 0) {
            $etcBase.each(function () {
                const title = $(this).find('h2').text();
                if (title.includes('관련 제작물')) {
                    const $data = $(this).find('table tbody tr');
                    $data.each(function() {
                        const infoCraft = {
                            className: $(this).find('td:eq(0) a p b').text(),
                            itemName: $(this).find('td:eq(0) a p i').text(),
                            recipeBook: $(this).find('td:eq(0) a p span').text(),
                            recipeLevel: $(this).find('td:eq(1)').text().trim(),
                            recipeStar: $(this).find('td:eq(1) img').length,
                        };

                        result.recipeCraft.push(infoCraft);
                    });
                }
                else if (title.includes('채집 정보')) {
                    const $data = $(this).find('table tbody tr');
                }
            });
       }

        return result;
    }
}