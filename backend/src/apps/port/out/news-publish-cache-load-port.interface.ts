export interface NewsPublishCacheLoadPort {
  getNewsGuildWebhooks(typeStr: string, locale: string): Promise<string[]>;
  getResendItemLength(): Promise<number>;
  getHookUrlByGuildId(pGuildId: string): Promise<string>;
}

export const NewsPublishCacheLoadPortToken = Symbol('NewsPublishCacheLoadPort');
