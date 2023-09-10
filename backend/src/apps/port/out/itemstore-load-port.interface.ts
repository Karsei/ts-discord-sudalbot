import { XivVersion } from '../../../entities/xiv-version.entity';
import { XivItemCategories } from '../../../entities/xiv-item-categories.entity';
import { PaginationParams } from '../../../definitions/interface/archive';
import { XivItem } from '../../../entities/xiv-item.entity';

export interface ItemStoreLoadPort {
  getLatestKoreanVersionFromDB(): Promise<XivVersion>;
  getItemCategoriesByIdx(
    locale: string,
    idx: number,
  ): Promise<XivItemCategories[]>;
  getItemsByIdx(locale: string, idx: number): Promise<XivItem[]>;
  getItemsByName(
    locale: string,
    name: string,
    paginationParams: PaginationParams,
  ): Promise<[XivItem[], number]>;
}

export const ItemStoreLoadPortToken = Symbol('ItemStoreLoadPort');
