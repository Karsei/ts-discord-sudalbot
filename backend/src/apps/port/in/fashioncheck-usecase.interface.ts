import { EmbedBuilder } from 'discord.js';
import { Submission } from 'snoowrap';

export interface FashionCheckUseCase {
  getFashion(): Promise<Submission>;
  makeTopicMessage(fashionInfo: Submission): EmbedBuilder;
}

export const FashionCheckUseCaseToken = Symbol('FashionCheckUseCase');
