import { Inject, Injectable } from '@nestjs/common';

import { ManagedWebhook } from '../../service/fashioncheck/fashioncheck.service';
import { FashionCheckLoadPort } from '../../port/out/fashioncheck-load-port.interface';
import { FashionCheckSavePort } from '../../port/out/fashioncheck-save-port.interface';
import {
  FashionCheckCacheLoadPort,
  FashionCheckCacheLoadPortToken,
} from '../../port/out/fashioncheck-cache-load-port.interface';
import {
  FashionCheckCacheSavePort,
  FashionCheckCacheSavePortToken,
} from '../../port/out/fashioncheck-cache-save-port.interface';
import {
  FashionCheckDbLoadPort,
  FashionCheckDbLoadPortToken,
} from '../../port/out/fashioncheck-db-load-port.interface';
import {
  FashionCheckDbSavePort,
  FashionCheckDbSavePortToken,
} from '../../port/out/fashioncheck-db-save-port.interface';
import { NewsPublishSavePort } from '../../port/out/news-publish-save-port.interface';
import {
  NewsPublishDbSavePort,
  NewsPublishDbSavePortToken,
} from '../../port/out/news-publish-db-save-port.interface';
import {
  NewsPublishCacheSavePort,
  NewsPublishCacheSavePortToken,
} from '../../port/out/news-publish-cache-save-port.interface';

@Injectable()
export class DbCacheAdapter
  implements FashionCheckLoadPort, FashionCheckSavePort, NewsPublishSavePort
{
  constructor(
    @Inject(FashionCheckCacheLoadPortToken)
    private readonly cacheLoadPort: FashionCheckCacheLoadPort,
    @Inject(FashionCheckCacheSavePortToken)
    private readonly cacheSavePort: FashionCheckCacheSavePort,
    @Inject(FashionCheckDbLoadPortToken)
    private readonly dbLoadPort: FashionCheckDbLoadPort,
    @Inject(FashionCheckDbSavePortToken)
    private readonly dbSavePort: FashionCheckDbSavePort,
    @Inject(NewsPublishCacheSavePortToken)
    private readonly newsPublishCacheSavePort: NewsPublishCacheSavePort,
    @Inject(NewsPublishDbSavePortToken)
    private readonly newsPublishDbSavePort: NewsPublishDbSavePort,
  ) {}

  async getFashionCheckNoticeWebhookGuildIds(): Promise<string[]> {
    const cache =
      await this.cacheLoadPort.getFashionCheckNoticeWebhookGuildIds();
    if (cache != null) return cache;

    return await this.dbLoadPort.getFashionCheckNoticeWebhookGuildIds();
  }

  async getFashionCheckGuildNoticeWebhook(
    guildId: string,
  ): Promise<ManagedWebhook> {
    const cache = await this.cacheLoadPort.getFashionCheckNoticeWebhook(
      guildId,
    );
    if (cache != null) return cache;

    return this.dbLoadPort.getFashionCheckNoticeWebhook(guildId);
  }

  async setFashionCheckNoticeGuildWebhook(webhook: ManagedWebhook) {
    // DB
    await this.dbSavePort.setFashionCheckNoticeWebhook(webhook);
    // Cache
    return this.cacheSavePort.setFashionCheckNoticeWebhook(webhook);
  }

  async delFashionCheckNoticeWebhook(webhook: ManagedWebhook): Promise<void> {
    await this.cacheSavePort.delFashionCheckNoticeWebhook(webhook);
    await this.dbSavePort.delFashionCheckNoticeWebhook(webhook);
  }

  async isExistFashionCheckTopic(topicId: string): Promise<number> {
    return this.cacheLoadPort.isExistFashionCheckTopic(topicId);
  }

  async setFashionCheckTopic(topicId: string): Promise<number> {
    return this.cacheSavePort.setFashionCheckTopic(topicId);
  }

  /**
   * 게시글별 Webhook URL Cache 등록
   *
   * @param guildId 서버 ID
   * @param locale 언어
   * @param type 카테고리
   * @param url Webhook URL
   */
  async addNewsWebhookUrl(
    guildId: string,
    locale: string,
    type: string,
    url: string,
  ) {
    await this.newsPublishDbSavePort.addNewsWebhookUrl(
      guildId,
      locale,
      type,
      url,
    );
    return this.newsPublishCacheSavePort.addNewsWebhookUrl(
      guildId,
      locale,
      type,
      url,
    );
  }

  /**
   * 게시글별 Webhook URL Cache 삭제
   *
   * @param guildId 서버 ID
   * @param locale 언어
   * @param type 카테고리
   * @param url Webhook URL
   */
  async delNewsWebhookUrl(
    guildId: string,
    locale: string,
    type: string,
    url: string,
  ) {
    await this.newsPublishDbSavePort.delNewsWebhookUrl(
      guildId,
      locale,
      type,
      url,
    );
    return this.newsPublishCacheSavePort.delNewsWebhookUrl(
      guildId,
      locale,
      type,
      url,
    );
  }
}
