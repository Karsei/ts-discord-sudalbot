import { EmbedBuilder } from 'discord.js';

export interface NewsPublishDiscordUseCase {
  sendNews(
    whiteList: Array<string>,
    post: EmbedBuilder[],
    type: string,
    locale: string,
  ): Promise<void>;
  resendNews(): Promise<void>;
}

export const NewsPublishDiscordUseCaseToken = Symbol(
  'NewsPublishDiscordUseCase',
);
