import { EmbedBuilder } from 'discord.js';

export interface MarketUseCase {
  getInfo(server: string, keyword: string): Promise<EmbedBuilder>;
}

export const MarketUseCaseToken = Symbol('MarketUseCase');
