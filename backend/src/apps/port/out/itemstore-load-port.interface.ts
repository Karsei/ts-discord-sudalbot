import { XivVersion } from '../../../entities/xiv-version.entity';

export interface ItemStoreLoadPort {
  getLatestKoreanVersionFromDB(): Promise<XivVersion>;
}

export const ItemStoreLoadPortToken = Symbol('ItemStoreLoadPort');
