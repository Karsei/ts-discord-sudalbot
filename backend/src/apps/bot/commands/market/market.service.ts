import { AxiosResponse } from 'axios';
import moment from 'moment';
import { EmbedBuilder } from 'discord.js';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UniversalisService } from './universalis.service';
import { ItemSearchService } from '../item/item-search.service';
import { MarketError } from '../../../../exceptions/market.exception';
import { AggregatedItemInfo } from '../../../../definitions/interface/xivitem';

@Injectable()
export class MarketService {
  constructor(
    private readonly configService: ConfigService,
    private readonly universalisService: UniversalisService,
    private readonly itemSearchService: ItemSearchService,
  ) {}

  async getInfo(server: string, keyword: string) {
    if (/[가-힣]/gi.test(keyword)) {
      throw new MarketError('한국 서비스는 지원하지 않아요!');
    }
    keyword = keyword.toLowerCase();

    const results = await this.itemSearchService.fetchSearchItem(keyword);

    const itemId = results.id;
    const marketRes = await this.universalisService.fetchCurrentList(
      server,
      itemId,
    );
    if (
      !marketRes.data.hasOwnProperty('listings') ||
      marketRes.data.listings.length < 1
    ) {
      throw new MarketError('시장에 등록된 아이템이 없어요.');
    }

    const total = marketRes.data.listings.length;
    const itemStr = this.makeItemInfo(total, marketRes);
    const historyStr = this.makeItemHistoryInfo(marketRes);

    return this.makeMessage(results, itemId, marketRes, itemStr, historyStr);
  }

  private makeItemInfo(total, list: AxiosResponse<any>) {
    let itemStr = '';
    for (let idx = 0; idx < total; idx++) {
      if (idx > 9) break;
      if (itemStr.length > 0) {
        itemStr += '\n';
      }
      const item = list.data.listings[idx];

      itemStr +=
        `${idx + 1}. ${item.quantity}개` +
        (item.hq ? ' [HQ]' : '') +
        (item.materia.length > 0 ? ' [마테리아 O]' : '') +
        ` 총 ${item.total.toLocaleString()}길` +
        ` (개당 ${item.pricePerUnit.toLocaleString()}길) -` +
        ` By. ${item.retainerName}` +
        (item.hasOwnProperty('worldName') ? ` (${item.worldName})` : '');
    }
    return itemStr;
  }

  private makeItemHistoryInfo(list: AxiosResponse<any>) {
    const historyTotal = list.data.recentHistory.length;
    let historyStr = '';
    for (let idx = 0; idx < historyTotal; idx++) {
      if (idx > 9) break;
      if (historyStr.length > 0) {
        historyStr += '\n';
      }
      const item = list.data.recentHistory[idx];

      historyStr +=
        `[${moment(new Date(item.timestamp * 1000)).format(
          'YYYY/MM/DD HH:mm:ss',
        )}] ${item.quantity}개` +
        (item.hq ? ' [HQ]' : '') +
        ` 총 ${item.total.toLocaleString()}길` +
        ` (개당 ${item.pricePerUnit.toLocaleString()}길)\n` +
        ` → ${item.buyerName} ${
          item.hasOwnProperty('worldName') ? `(${item.worldName})` : ''
        } (이)가 구매`;
    }
    return historyStr;
  }

  private makeMessage(
    filtered: AggregatedItemInfo,
    itemId: number,
    list: AxiosResponse<any>,
    itemStr: string,
    historyStr: string,
  ) {
    const total = list.data.listings.length;
    const historyTotal = list.data.recentHistory.length;
    const lastUploadTime = moment(new Date(list.data.lastUploadTime)).format(
      'YYYY년 MM월 DD일 HH시 mm분 ss초',
    );

    return new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(filtered.nameKr ? filtered.nameKr : filtered.name)
      .setDescription('상세한 정보를 보려면 위 링크를 클릭하세요.')
      .setURL(`https://universalis.app/market/${itemId}`)
      .addFields(
        {
          name: `아이템 이름`,
          value: `:flag_us: ${filtered.nameEn}\n:flag_jp: ${
            filtered.nameJa
          }\n:flag_kr: ${
            filtered.nameKr ? filtered.nameKr : '(알 수 없음)'
          }\n:flag_de: ${filtered.nameDe}\n:flag_fr: ${filtered.nameFr}`,
        },
        {
          name: `평균 시세`,
          value: `${list.data.averagePrice.toFixed(2).toLocaleString()}길`,
          inline: true,
        },
        {
          name: `최소 (NQ/HQ)`,
          value: `${list.data.minPriceNQ
            .toFixed(2)
            .toLocaleString()}길 / ${list.data.minPriceHQ
            .toFixed(2)
            .toLocaleString()}길`,
          inline: true,
        },
        {
          name: `최대 (NQ/HQ)`,
          value: `${list.data.maxPriceNQ
            .toFixed(2)
            .toLocaleString()}길 / ${list.data.maxPriceHQ
            .toFixed(2)
            .toLocaleString()}길`,
          inline: true,
        },
        {
          name: `시장 검색 결과 (총 ${
            total >= 100 ? '100건 이상' : `${total.toLocaleString()}건`
          })`,
          value: itemStr,
        },
        {
          name: `최근 구매 내역 (총 ${
            historyTotal >= 100
              ? '100건 이상'
              : `${historyTotal.toLocaleString()}건`
          })`,
          value: historyStr,
        },
        {
          name: '마지막 갱신 날짜',
          value: `${lastUploadTime}`,
        },
      )
      .setThumbnail(`https://xivapi.com${filtered.itemIcon}`)
      .setTimestamp()
      .setFooter({
        text: this.configService.get('APP_NAME'),
      });
  }
}
