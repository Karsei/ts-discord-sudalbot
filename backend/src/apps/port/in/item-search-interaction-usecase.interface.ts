import { ActionRowBuilder, EmbedBuilder, SelectMenuBuilder } from 'discord.js';

import { ItemSearchList } from '../../service/item/item-search.service';
import { PaginationParams } from '../../../definitions/interface/archive';
import { AggregatedItemInfo } from '../../../definitions/interface/xivitem';

export interface ItemSearchInteractionUseCase {
  list(
    keyword: string,
    searchResults: ItemSearchList,
    paginationParams: PaginationParams,
  ): { embedMsg: EmbedBuilder; component: ActionRowBuilder<SelectMenuBuilder> };
  info(info: AggregatedItemInfo): Promise<{ embedMsg: EmbedBuilder }>;
}

export const ItemSearchInteractionUseCaseToken = Symbol(
  'ItemSearchInteractionUseCase',
);
