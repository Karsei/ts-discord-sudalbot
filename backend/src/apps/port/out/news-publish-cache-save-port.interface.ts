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
}

export const NewsPublishCacheSavePortToken = Symbol('NewsPublishCacheSavePort');
