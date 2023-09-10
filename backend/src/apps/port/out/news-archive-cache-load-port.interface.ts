export interface NewsArchiveCacheLoadPort {
  getCache(type: string, locale: string): Promise<string>;
  isOutDate(type: string, locale: string): Promise<boolean>;
}

export const NewsArchiveCacheLoadPortToken = Symbol('NewsArchiveCacheLoadPort');
