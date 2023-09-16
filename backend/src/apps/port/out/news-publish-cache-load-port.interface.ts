export interface NewsPublishCacheLoadPort {
  getNewsGuildWebhooks(typeStr: string, locale: string): Promise<string[]>;
  getResendItemLength(): Promise<number>;

  /**
   * 서버 고유번호로 Webhook URL 조회
   *
   * @param guildId 서버 고유 번호
   * @return Webhook URL
   */
  getHookUrlByGuildId(guildId: string): Promise<string>;

  checkInAllWebhooks(pUrl: string): Promise<number>;

  /**
   * 특정 소식에 해당 Webhook URL이 있는지 확인
   *
   * @param pLocale 언어
   * @param pType 카테고리
   * @param pUrl Webhook URL
   */
  checkInWebhook(pLocale: string, pType: string, pUrl: string);
}

export const NewsPublishCacheLoadPortToken = Symbol('NewsPublishCacheLoadPort');
