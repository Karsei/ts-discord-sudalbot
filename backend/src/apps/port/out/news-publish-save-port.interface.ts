export interface NewsPublishSavePort {
  /**
   * 게시글별 Webhook URL 등록
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
   * 게시글별 Webhook URL 삭제
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

export const NewsPublishSavePortToken = Symbol('NewsPublishSavePort');
