import { DeleteResult, InsertResult } from 'typeorm';

export interface NewsPublishDbSavePort {
  /**
   * 게시글별 Webhook URL DB 등록
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
  ): Promise<InsertResult>;

  /**
   * 게시글별 Webhook URL DB 삭제
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
    url?: string,
  ): Promise<DeleteResult>;
}

export const NewsPublishDbSavePortToken = Symbol('NewsPublishDbSavePort');
