import { Locales } from '../../../definitions/common.type';

export interface NewsUseCase {
  makeComponent(locale: Locales, guildId: string, doCheckExist: boolean);
}

export const NewsUseCaseToken = Symbol('NewsUseCase');
