export interface NewsArchiveCacheSavePort {
  setCache(news: string, type: string, locale: string): Promise<void>;
}

export const NewsArchiveCacheSavePortToken = Symbol('NewsArchiveCacheSavePort');
