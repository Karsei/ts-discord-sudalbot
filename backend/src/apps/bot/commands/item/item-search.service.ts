import { EmbedBuilder } from 'discord.js';
import { Like, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { XivapiService } from './xivapi.service';
import { GuideFetchHelper } from './guide-fetch.helper';
import { ItemSearchError } from '../../../../exceptions/item-search.exception';
import { ItemSearchTooManyResultsError } from '../../../../exceptions/item-search-too-many-results.exception';
import { XivVersion } from '../../../../entities/xiv-version.entity';
import { XivItem } from '../../../../entities/xiv-item.entity';
import { XivItemCategories } from '../../../../entities/xiv-item-categories.entity';
import { AggregatedItemInfo } from '../../../../definitions/interface/xivitem';
import { PaginationParams } from '../../../../definitions/common.type';

export interface ItemSearchList {
  pagination: { ResultsTotal: number };
  data: ItemSearchListItem[];
}

export interface ItemSearchListItem {
  Name: string;
  ID: number;
}

@Injectable()
export class ItemSearchService {
  constructor(
    private readonly configService: ConfigService,
    private readonly xivapiService: XivapiService,
    @InjectRepository(XivVersion)
    private xivVersionRepository: Repository<XivVersion>,
    @InjectRepository(XivItem) private xivItemRepository: Repository<XivItem>,
    @InjectRepository(XivItemCategories)
    private xivItemCategoriesRepository: Repository<XivItemCategories>,
  ) {}

  async search(keyword: string) {
    let embedMsg: EmbedBuilder;
    try {
      const aggregated = await this.fetchSearchItem(keyword);

      let dbLinks = await this.getDbSiteLinks(aggregated);
      embedMsg = this.makeItemInfoEmbedMessage(aggregated, dbLinks);
    } catch (e) {
      // 데이터가 너무 많은 경우 목록을 보여줌
      if (e instanceof ItemSearchTooManyResultsError) {
        let itmListstr = '';
        for (
          let itmIdx = 0, itmLen = e.result.length;
          itmIdx < itmLen;
          itmIdx++
        ) {
          if (itmIdx > 9) break;
          if (itmListstr.length > 0) itmListstr += '\n';
          itmListstr += `${itmIdx + 1}. ${e.result[itmIdx].Name}`;
        }
        embedMsg = this.makeItemRemainListInfoEmbedMessage(
          keyword,
          e.pagination,
          itmListstr,
        );
      } else {
        throw e;
      }
    }

    return embedMsg;
  }

  async fetchSearchItem(keyword: string) {
    const { pagination, data } = await this.fetchSearchItems(keyword, {
      page: 1,
      perPage: 10,
    });

    if (data.length < 1)
      throw new ItemSearchError('데이터를 발견하지 못했어요!');
    if (data.length > 1 && data[0].Name.toLowerCase() !== keyword)
      throw new ItemSearchTooManyResultsError(
        '아이템 검색 결과가 많아요! 이름을 정확하게 입력하고 다시 시도해보세요.',
        pagination,
        data,
      );

    return await this.aggregateKoreanItemInfo(data[0].ID);
  }

  async fetchSearchItemById(itemId: number) {
    return await this.aggregateKoreanItemInfo(itemId);
  }

  async fetchSearchItems(
    keyword: string,
    paginationParams: PaginationParams,
  ): Promise<ItemSearchList> {
    let searchRes;
    if (!/[가-힣]/gi.test(keyword)) {
      searchRes = await this.searchFromGlobal(keyword, paginationParams);
    } else {
      searchRes = await this.searchFromKorea(keyword, paginationParams);
    }

    return {
      pagination: searchRes.data.Pagination,
      data: searchRes.data.Results,
    };
  }

  private async aggregateKoreanItemInfo(itemId: number) {
    // 한 번 더 검색을 한다.
    let itemRes = await this.xivapiService.fetchItem(itemId);
    if (
      !itemRes.hasOwnProperty('data') ||
      !itemRes.data.hasOwnProperty('Name')
    ) {
      throw new ItemSearchError('정보를 불러오는 과정에서 오류가 발생했어요!');
    }

    const itemDetail = itemRes.data;

    const filtered: AggregatedItemInfo = {
      id: itemDetail.ID,
      name: itemDetail.Name,
      nameEn: itemDetail.Name_en,
      nameJa: itemDetail.Name_ja,
      nameKr: null,
      nameDe: itemDetail.Name_de,
      nameFr: itemDetail.Name_fr,
      itemIcon: itemDetail.IconHD,
      itemLevel: itemDetail.LevelItem,
      itemUiCategoryName: itemDetail.ItemUICategory.Name,
      itemUiCategoryNameKr: null,
      gamePatchVersion: itemDetail.GamePatch
        ? `v${itemDetail.GamePatch.Version}`
        : '(정보 없음)',
      desc: itemDetail.Description.replace(/(\r\n\t|\n|\r\t)/gm, ' '),
      descKr: null,
      desynth: itemDetail.Desynth,
      isCollectable: itemDetail.IsCollectable,
    };

    // 한국어 관련
    // 아이템
    const koreanItemFetch = await this.getItemsByIdx('kr', itemId);
    if (koreanItemFetch && koreanItemFetch.length > 0) {
      const itemParsed = JSON.parse(koreanItemFetch[0].content);
      if (itemParsed.Name && itemParsed.Name.length > 0) {
        filtered.nameKr = itemParsed.Name;
      }
      if (itemParsed.Description && itemParsed.Description.length > 0) {
        filtered.descKr = itemParsed.Description;
      }

      const koreanItemUiCategory = await this.getItemCategoriesByIdx(
        'kr',
        itemDetail.ItemUICategory.ID,
      );
      if (koreanItemUiCategory && koreanItemUiCategory.length > 0) {
        const itemUiParsed = JSON.parse(koreanItemUiCategory[0].content);
        filtered.itemUiCategoryNameKr = itemUiParsed.Name;
      }
    }

    return filtered;
  }

  private async getItemsByIdx(locale: string, idx: number) {
    return await this.xivItemRepository.find({
      where: {
        version: { locale: locale },
        itemIdx: idx,
      },
      order: { version: { version: 'DESC' } },
    });
  }

  private async getItemsByName(
    locale: string,
    name: string,
    paginationParams: PaginationParams,
  ) {
    return await this.xivItemRepository.findAndCount({
      where: {
        version: { locale: locale },
        name: Like(`%${name}%`),
      },
      take: paginationParams.perPage,
      skip: (paginationParams.page - 1) * paginationParams.perPage,
    });
  }

  private async getItemCategoriesByIdx(locale: string, idx: number) {
    return await this.xivItemCategoriesRepository.find({
      where: {
        version: { locale: locale },
        itemCategoryIdx: idx,
      },
      order: { version: { version: 'DESC' } },
    });
  }

  private async searchFromGlobal(
    keyword: string,
    paginationParams: PaginationParams,
  ) {
    keyword = keyword.toLowerCase();

    const constSearchBody: object = {
      query: {
        bool: {
          should: [
            {
              wildcard: {
                NameCombined_en: `*${keyword}*`,
              },
            },
            {
              wildcard: {
                NameCombined_ja: `*${keyword}*`,
              },
            },
            {
              wildcard: {
                NameCombined_fr: `*${keyword}*`,
              },
            },
            {
              wildcard: {
                NameCombined_de: `*${keyword}*`,
              },
            },
          ],
        },
      },
      from: (paginationParams.page - 1) * paginationParams.perPage,
      size: paginationParams.perPage,
    };
    const searchRes = await this.xivapiService.fetchElasticSearch(
      'item',
      constSearchBody,
    );
    if (
      !searchRes.hasOwnProperty('data') ||
      !searchRes.data.hasOwnProperty('Results')
    ) {
      throw new ItemSearchError('정보를 불러오는 과정에서 오류가 발생했어요!');
    }
    if (
      Array.isArray(searchRes.data.Results) &&
      searchRes.data.Results.length <= 0
    ) {
      throw new ItemSearchError('데이터를 발견하지 못했어요!');
    }

    return searchRes;
  }

  private async searchFromKorea(keyword: string, pagination: PaginationParams) {
    // 데이터 초기화
    const searchRes = {
      data: {
        Pagination: {
          ResultsTotal: 0,
        },
        Results: [],
      },
    };

    // 이름을 찾는다.
    const [data, total] = await this.getItemsByName('kr', keyword, pagination);
    for (const itemIdx of Object.keys(data)) {
      if (itemIdx == 'meta') continue;
      const item = data[itemIdx];
      if (item.name.toLowerCase().includes(keyword)) {
        searchRes.data.Results.push({
          Name: item.name,
          ID: item.itemIdx,
        });
      }
    }
    searchRes.data.Pagination.ResultsTotal = total;

    if (
      Array.isArray(searchRes.data.Results) &&
      searchRes.data.Results.length <= 0
    ) {
      throw new ItemSearchError('데이터를 발견하지 못했어요!');
    }

    return searchRes;
  }

  private makeItemRemainListInfoEmbedMessage(
    keyword: string,
    pagination: { ResultsTotal: number },
    itmListstr: string,
  ) {
    return new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`아이템 검색`)
      .setDescription(
        `상세 정보를 보려면 이름을 완전히 똑같이 해서 검색하세요.`,
      )
      .addFields({
        name: `"${keyword}" 검색 결과 (총 ${pagination.ResultsTotal}개)`,
        value: itmListstr,
      })
      .setTimestamp(new Date())
      .setFooter({
        text: this.configService.get('APP_NAME'),
      });
  }

  private async getDbSiteLinks(filtered: AggregatedItemInfo) {
    let koreaDbLink = '';
    try {
      koreaDbLink = await GuideFetchHelper.searchItemUrl(filtered.nameKr);
    } catch (ee) {
      console.error(ee);
    }

    return (
      `[FF14 글로벌 공식 DB](https://na.finalfantasyxiv.com/lodestone/playguide/db/search/?q=${filtered.nameEn.replace(
        / /gm,
        '+',
      )})` +
      (koreaDbLink != '' ? `\n[FF14 한국 공식 DB](${koreaDbLink})` : '') +
      `\n[Garland Tools](https://www.garlandtools.org/db/#item/${filtered.id})` +
      `\n[Teamcraft](https://ffxivteamcraft.com/db/ko/item/${filtered.id})` +
      `\n[XIVAPI](https://xivapi.com/item/${filtered.id})` +
      `\n[타르토맛 타르트](https://ff14.tar.to/item/view/${filtered.id})` +
      `\n[Project Anyder](https://anyder.vercel.app/item/${filtered.id})` +
      `\n[Gamerescape](https://ffxiv.gamerescape.com/wiki/${filtered.nameEn.replace(
        / /gm,
        '_',
      )})` +
      `\n[Web Model Viewer](https://ffxiv.dlunch.net/model?itemId=${filtered.id}&language=7)` +
      `\n[FF14 인벤](https://ff14.inven.co.kr/dataninfo/item/detail.php?code=${filtered.id})`
    );
  }

  private makeItemInfoEmbedMessage(
    filtered: AggregatedItemInfo,
    dbLinks: string,
  ) {
    return new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(filtered.nameKr ? filtered.nameKr : filtered.name)
      .setDescription(filtered.descKr ? filtered.descKr : filtered.desc)
      .addFields(
        {
          name: `아이템 이름`,
          value: `:flag_us: ${filtered.nameEn}\n:flag_jp: ${
            filtered.nameJa
          }\n:flag_kr: ${
            filtered.nameKr ? filtered.nameKr : '(알 수 없음)'
          }\n:flag_de: ${filtered.nameDe}\n:flag_fr: ${filtered.nameFr}`,
        },
        { name: `아이템 레벨`, value: `${filtered.itemLevel}`, inline: true },
        {
          name: `출시 버전`,
          value: filtered.gamePatchVersion,
          inline: true,
        },
        { name: `고유번호`, value: `${filtered.id}`, inline: true },
        { name: `종류`, value: filtered.itemUiCategoryName, inline: true },
        {
          name: `아이템 분해`,
          value: filtered.desynth === 0 ? '불가' : '가능',
          inline: true,
        },
        {
          name: `아이템 정제`,
          value: filtered.isCollectable === 0 ? '불가' : '가능',
          inline: true,
        },
        { name: `DB 링크`, value: dbLinks },
      )
      .setThumbnail(`https://xivapi.com${filtered.itemIcon}`)
      .setTimestamp()
      .setFooter({
        text: this.configService.get('APP_NAME'),
      });
  }
}
