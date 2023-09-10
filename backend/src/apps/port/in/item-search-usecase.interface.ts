import { AggregatedItemInfo } from '../../../definitions/interface/xivitem';
import { PaginationParams } from '../../../definitions/interface/archive';
import { ItemSearchList } from '../../service/item/item-search.service';

export interface ItemSearchUseCase {
  fetchSearchItem(keyword: string): Promise<AggregatedItemInfo>;
  fetchSearchItems(
    keyword: string,
    paginationParams: PaginationParams,
  ): Promise<ItemSearchList>;
  fetchSearchItemById(itemId: number): Promise<AggregatedItemInfo>;
}

export const ItemSearchUseCaseToken = Symbol('ItemSearchUseCase');
