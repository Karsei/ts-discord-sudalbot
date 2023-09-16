import { ActionRowBuilder, SelectMenuBuilder } from 'discord.js';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import NewsCategories from '../../../definitions/interface/archive';
import { NoticeError } from '../../../exceptions/notice.exception';
import {
  Locales,
  SubscribeArticleCategory,
} from '../../../definitions/common.type';
import { NewsUseCase } from '../../port/in/news-usecase.interface';
import {
  NewsPublishCacheLoadPort,
  NewsPublishCacheLoadPortToken,
} from '../../port/out/news-publish-cache-load-port.interface';

@Injectable()
export class NoticeService implements NewsUseCase {
  private readonly menuComponentId = 'notify-pickup';

  constructor(
    private readonly configService: ConfigService,
    @Inject(NewsPublishCacheLoadPortToken)
    private readonly newsPublishCacheLoadPort: NewsPublishCacheLoadPort,
  ) {}

  async makeComponent(locale: Locales, guildId: string, doCheckExist: boolean) {
    const hookUrl = await this.newsPublishCacheLoadPort.getHookUrlByGuildId(
      guildId,
    );
    if (!hookUrl) {
      throw new NoticeError('해당 디스코드 서버의 Webhook 을 찾지 못했어요!');
    }

    return await this.makeSelectComponent(locale, hookUrl, doCheckExist);
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
    const showStrRes = [];
    const selectRes = [];

    const locales = Object.keys(Locales).filter((locale) => locale);
    const types = [
      ...new Set([
        ...Object.keys(NewsCategories.Global),
        ...Object.keys(NewsCategories.Korea),
      ]),
    ];
    for (const localeIdx in locales) {
      if (Locales[locales[localeIdx]] == locale) {
        for (const typeIdx in types) {
          const resCheck = await this.newsPublishCacheLoadPort.checkInWebhook(
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
}
