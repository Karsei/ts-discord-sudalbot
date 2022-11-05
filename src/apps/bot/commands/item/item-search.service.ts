import { EmbedBuilder } from 'discord.js';
import { Like, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { XivapiService } from './xivapi.service';
import { GuideFetchHelper } from './guide-fetch.helper';
import { ItemSearchError } from '../../../../exceptions/item-search.exception';
import { XivVersion } from '../../../../entities/xiv-version.entity';
import { XivItem } from '../../../../entities/xiv-item.entity';
import { XivItemCategories } from '../../../../entities/xiv-item-categories.entity';

@Injectable()
export class ItemSearchService {
    constructor(private readonly configService: ConfigService,
                private readonly xivapiService: XivapiService,
                @InjectRepository(XivVersion) private xivVersionRepository: Repository<XivVersion>,
                @InjectRepository(XivItem) private xivItemRepository: Repository<XivItem>,
                @InjectRepository(XivItemCategories) private xivItemCategoriesRepository: Repository<XivItemCategories>) {
    }

    async search(keyword: string) {
        let searchRes: any = this.fetchSearch(keyword);

        const pagination = searchRes.data.Pagination;
        const results = searchRes.data.Results;

        let embedMsg: EmbedBuilder;
        if (results.length > 1 && results[0].Name.toLowerCase() !== keyword) {
            let itmListstr = '';
            for (let itmIdx = 0, itmLen = results.length; itmIdx < itmLen; itmIdx++) {
                if (itmIdx > 9) break;
                if (itmListstr.length > 0) itmListstr += "\n";
                itmListstr += `${itmIdx + 1}. ${results[itmIdx].Name}`;
            }
            embedMsg = this.makeItemRemainListInfoEmbedMessage(keyword, pagination, itmListstr);
        } else {
            // 한 번 더 검색을 한다.
            let itemRes = await this.xivapiService.fetchItem(results[0].ID);
            if (!itemRes.hasOwnProperty('data') || !itemRes.data.hasOwnProperty('Name')) {
                throw new ItemSearchError('정보를 불러오는 과정에서 오류가 발생했어요!');
            }

            const itemDetail = itemRes.data;

            const koreanData = {
                name: '(알 수 없음)',
            };
            const filtered = {
                name: itemDetail.Name,
                desc: itemDetail.Description.replace(/(\r\n\t|\n|\r\t)/gm, " "),
                itemUiCategoryName: itemDetail.ItemUICategory.Name,
            };

            // 한국어 관련
            // 아이템
            const koreanItemFetch = await this.getItemByIdx('kr', results[0].ID);
            if (koreanItemFetch) {
                const itemParsed = JSON.parse(koreanItemFetch.content);
                if (itemParsed.Name && itemParsed.Name.length > 0) {
                    koreanData.name = itemParsed.Name;
                    filtered.name = itemParsed.Name;
                }
                if (itemParsed.Description && itemParsed.Description.length > 0) {
                    filtered.desc = itemParsed.Description;
                }

                const koreanItemUiCategory = await this.getItemCategoriesByIdx('kr', itemDetail.ItemUICategory.ID);
                if (koreanItemUiCategory) {
                    const itemUiParsed = JSON.parse(koreanItemUiCategory.content);
                    filtered.itemUiCategoryName = itemUiParsed.Name;
                }
            }
            let koreaDbLink = '';
            try {
                koreaDbLink = await GuideFetchHelper.searchItemUrl(koreanData.name);
            } catch (ee) {
                console.error(ee);
            }

            let dbLinks = this.getDbSiteLinks(itemDetail, koreaDbLink);

            embedMsg = this.makeItemInfoEmbedMessage(filtered, itemDetail, koreanData, dbLinks);
        }

        return embedMsg;
    }

    private async getItemByIdx(locale: string, idx: number) {
        return await this.xivItemRepository.findOne({
            where: [
                { version: { locale: locale }},
                { itemIdx: idx }
            ],
            order: { version: { version: 'DESC' }}});
    }

    private async getItemByName(locale: string, name: string) {
        return await this.xivItemRepository.findOne({
            where: [
                { version: { locale: locale }},
                { name: Like(`%${name}%`) }
            ],
            order: { version: { version: 'DESC' }}});
    }

    private async getItemCategoriesByIdx(locale: string, idx: number) {
        return await this.xivItemCategoriesRepository.findOne({
            where: [
                { version: { locale: locale }},
                { itemCategoryIdx: idx }
            ],
            order: { version: { version: 'DESC' }}});
    }

    private fetchSearch(keyword: string) {
        if (!/[가-힣]/gi.test(keyword)) {
            return this.searchFromGlobal(keyword);
        } else {
            return this.searchFromKorea(keyword);
        }
    }

    private async searchFromGlobal(keyword: string) {
        const constSearchBody: object = {
            query: {
                bool: {
                    should: [
                        {
                            wildcard: {
                                'NameCombined_en': `*${keyword}*`
                            }
                        },
                        {
                            wildcard: {
                                'NameCombined_ja': `*${keyword}*`
                            }
                        },
                        {
                            wildcard: {
                                'NameCombined_fr': `*${keyword}*`
                            }
                        },
                        {
                            wildcard: {
                                'NameCombined_de': `*${keyword}*`
                            }
                        }
                    ]
                }
            },
            from: 0
        };
        const searchRes = await this.xivapiService.fetchElasticSearch('instantcontent', constSearchBody, 'ID,Name');
        if (!searchRes.hasOwnProperty('data') || !searchRes.data.hasOwnProperty('Results')) {
            throw new ItemSearchError('정보를 불러오는 과정에서 오류가 발생했어요!');
        }
        if (Array.isArray(searchRes.data.Results) && searchRes.data.Results.length <= 0) {
            throw new ItemSearchError('데이터를 발견하지 못했어요!');
        }

        return searchRes;
    }

    private async searchFromKorea(keyword: string) {
        // 데이터 초기화
        const searchRes = {
            data: {
                Pagination: {
                    ResultsTotal: 0
                },
                Results: [],
            }
        }

        // 이름을 찾는다.
        const kNames: any = await this.getItemByName('kr', keyword);
        for (const itemIdx of Object.keys(kNames)) {
            if (itemIdx == 'meta') continue;
            const item = kNames[itemIdx];
            if (item.name.toLowerCase().includes(keyword)) {
                searchRes.data.Results.push({
                    Name: item.name,
                    ID: item.idx,
                });
            }
        }
        searchRes.data.Pagination.ResultsTotal = searchRes.data.Results.length;

        if (Array.isArray(searchRes.data.Results) && searchRes.data.Results.length <= 0) {
            throw new ItemSearchError('데이터를 발견하지 못했어요!');
        }

        return searchRes;
    }

    private makeItemRemainListInfoEmbedMessage(keyword: string,
                                               pagination: { ResultsTotal: number },
                                               itmListstr: string) {
        return new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`아이템 검색`)
            .setDescription(`상세 정보를 보려면 이름을 완전히 똑같이 해서 검색하세요.`)
            .addFields(
                {name: `"${keyword}" 검색 결과 (총 ${pagination.ResultsTotal}개)`, value: itmListstr},
            )
            .setTimestamp(new Date())
            .setFooter({
                text: this.configService.get('APP_NAME'),
            });
    }

    private makeItemInfoEmbedMessage(filtered: { name: any; itemUiCategoryName: any; desc: any },
                                     itemDetail,
                                     koreanData: { name: string },
                                     dbLinks: string) {
        return new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(filtered.name)
            .setDescription(filtered.desc)
            .addFields(
                {
                    name: `아이템 이름`,
                    value: `:flag_us: ${itemDetail.Name_en}\n:flag_jp: ${itemDetail.Name_ja}\n:flag_kr: ${koreanData.name}\n:flag_de: ${itemDetail.Name_de}\n:flag_fr: ${itemDetail.Name_fr}`
                },
                {name: `아이템 레벨`, value: `${itemDetail.LevelItem}`, inline: true},
                {name: `출시 버전`, value: `v${itemDetail.GamePatch.Version}`, inline: true},
                {name: `고유번호`, value: `${itemDetail.ID}`, inline: true},
                {name: `종류`, value: filtered.itemUiCategoryName, inline: true},
                {name: `아이템 분해`, value: itemDetail.Desynth === 0 ? '불가' : '가능', inline: true},
                {name: `아이템 정제`, value: itemDetail.IsCollectable === 0 ? '불가' : '가능', inline: true},
                {name: `DB 링크`, value: dbLinks},
            )
            .setThumbnail(`https://xivapi.com${itemDetail.IconHD}`)
            .setTimestamp()
            .setFooter({
                text: this.configService.get('APP_NAME'),
            });
    }

    private getDbSiteLinks(itemDetail, koreaDbLink: string) {
        return `[FF14 글로벌 공식 DB](https://na.finalfantasyxiv.com/lodestone/playguide/db/search/?q=${itemDetail.Name_en.replace(/ /gm, '+')})` +
            (koreaDbLink != '' ? `\n[FF14 한국 공식 DB](${koreaDbLink})` : '') +
            `\n[Garland Tools](https://www.garlandtools.org/db/#item/${itemDetail.ID})` +
            `\n[Teamcraft](https://ffxivteamcraft.com/db/ko/item/${itemDetail.ID})` +
            `\n[XIVAPI](https://xivapi.com/item/${itemDetail.ID})` +
            `\n[타르토맛 타르트](https://ff14.tar.to/item/view/${itemDetail.ID})` +
            `\n[Project Anyder](https://anyder.vercel.app/item/${itemDetail.ID})` +
            `\n[Gamerescape](https://ffxiv.gamerescape.com/wiki/${itemDetail.Name_en.replace(/ /gm, "_")})` +
            `\n[Web Model Viewer](https://ffxiv.dlunch.net/model?itemId=${itemDetail.ID}&language=7)` +
            `\n[FF14 인벤](https://ff14.inven.co.kr/dataninfo/item/detail.php?code=${itemDetail.ID})`;
    }
}
