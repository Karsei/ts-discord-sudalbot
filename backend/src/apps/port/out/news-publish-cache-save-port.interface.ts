import { EmbedBuilder } from 'discord.js';

import { NewsContent } from '../../../definitions/interface/archive';

export interface NewsPublishCacheSavePort {
  addNewsId(post: NewsContent, typeStr: string, locale: string);
  popResendItem(): Promise<string>;
  addResendItem(
    url: string,
    post: { embeds: EmbedBuilder[] },
    locale: string,
    type: string,
  ): Promise<number>;
  delUrl(locale: string, type: string, url: string): Promise<number>;

  /**
   * 게시글별 Webhook URL Cache 등록
   *
   * @param guildId 서버 ID
   * @param locale 언어
   * @param type 카테고리
   * @param url Webhook URL
   */
  addNewsWebhookUrl(
    guildId: string,
    locale: string,
    type: string,
    url: string,
  ): Promise<number>;

  /**
   * 게시글별 Webhook URL Cache 삭제
   *
   * @param guildId 서버 ID
   * @param locale 언어
   * @param type 카테고리
   * @param url Webhook URL
   */
  delNewsWebhookUrl(
    guildId: string,
    locale: string,
    type: string,
    url: string,
  ): Promise<number>;
}

export const NewsPublishCacheSavePortToken = Symbol('NewsPublishCacheSavePort');
