export interface NoticeCacheSavePort {
  setCache(news: string, type: string, locale: string): Promise<void>;
}

export const NoticeCacheSavePortToken = Symbol('NoticeCacheSavePort');
