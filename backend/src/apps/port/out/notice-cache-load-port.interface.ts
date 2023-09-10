export interface NoticeCacheLoadPort {
  getCache(type: string, locale: string): Promise<string>;
  isOutDate(type: string, locale: string): Promise<boolean>;
}

export const NoticeCacheLoadPortToken = Symbol('NoticeCacheLoadPort');
