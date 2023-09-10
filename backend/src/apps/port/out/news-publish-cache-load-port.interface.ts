export interface NewsPublishCacheLoadPort {
  getNewsGuildWebhooks(typeStr: string, locale: string): Promise<string[]>;
  getResendItemLength(): Promise<number>;
}

export const NewsPublishCacheLoadPortToken = Symbol('NewsPublishCacheLoadPort');
