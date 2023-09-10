import { XivVersion } from '../../../entities/xiv-version.entity';

export interface ItemStoreSavePort {
  extracted(
    latestVersionRemote: number,
    latestVersionDb: XivVersion,
  ): Promise<void>;
}

export const ItemStoreSavePortToken = Symbol('ItemStoreSavePort');
