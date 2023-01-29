import { ActionRowBuilder, SelectMenuBuilder } from 'discord.js';
import { Like, Repository } from 'typeorm';
import Redis from 'ioredis';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisService } from '@liaoliaots/nestjs-redis';

import NewsCategories from '../../../../definitions/archive.constant';
import { NoticeError } from '../../../../exceptions/notice.exception';
import {
  Locales,
  SubscribeArticleCategory,
} from '../../../../definitions/common.type';

@Injectable()
export class NoticeService {
  private readonly menuComponentId = 'notify-pickup';

  private readonly redis: Redis;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.redis = this.redisService.getClient();
  }

  async makeComponent(locale: Locales, guildId: string, doCheckExist: boolean) {
    const hookUrl = await this.getHookUrlByGuildId(guildId);
    if (!hookUrl) {
      throw new NoticeError('해당 디스코드 서버의 Webhook 을 찾지 못했어요!');
    }

    return await this.makeSelectComponent(locale, hookUrl, doCheckExist);
  }

  /**
   * 서버 고유번호로 Webhook URL 조회
   *
   * @param guildId 서버 고유 번호
   * @return Webhook URL
   */
  private async getHookUrlByGuildId(guildId: string) {
    return this.redis.hget('all-guilds', guildId);
  }

  private async makeSelectComponent(
    locale: Locales,
    hookUrl: string,
    doCheckExist: boolean,
  ) {
    const { showItems, selectItems } = await this.makeSelectValues(
      locale,
      hookUrl,
      doCheckExist,
    );
    if (showItems.length <= 0) {
      throw new NoticeError('변경할 수 있는 소식 분류가 없어요!');
    }

    return new ActionRowBuilder<SelectMenuBuilder>().addComponents(
      new SelectMenuBuilder()
        .setCustomId(this.menuComponentId)
        .setPlaceholder('선택해주세요')
        .addOptions(selectItems),
    );
  }

  private async makeSelectValues(
    locale: Locales,
    hookUrl: string,
    doCheckExist: boolean,
  ) {
    let showStrRes = [];
    let selectRes = [];

    let locales = Object.keys(Locales).filter((locale) => locale);
    let types = [
      ...new Set([
        ...Object.keys(NewsCategories.Global),
        ...Object.keys(NewsCategories.Korea),
      ]),
    ];
    for (let localeIdx in locales) {
      if (Locales[locales[localeIdx]] == locale) {
        for (let typeIdx in types) {
          let resCheck = await this.checkInWebhook(
            locale,
            types[typeIdx],
            hookUrl,
          );
          if (doCheckExist ? resCheck : !resCheck) {
            showStrRes.push({ locale: locale, type: types[typeIdx] });
            selectRes.push({
              //label: `${Locales[locales[localeIdx]].name} - ${NotifyCategory[types[typeIdx]].name}`,
              label: `${locales[localeIdx]} - ${
                SubscribeArticleCategory[types[typeIdx].toUpperCase()]
              }`,
              value: `${locale}||${types[typeIdx]}`,
            });
          }
        }
      }
    }

    return {
      showItems: showStrRes,
      selectItems: selectRes,
    };
  }

  /**
   * 특정 소식에 해당 Webhook URL이 있는지 확인
   *
   * @param pLocale 언어
   * @param pType 카테고리
   * @param pUrl Webhook URL
   */
  private async checkInWebhook(pLocale: string, pType: string, pUrl: string) {
    return this.redis.sismember(`${pLocale}-${pType}-webhooks`, pUrl);
  }
}
