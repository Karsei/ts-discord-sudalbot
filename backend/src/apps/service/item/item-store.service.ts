import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common';

import {
  ClientFileLoadPort,
  ClientFileLoadPortToken,
} from '../../port/out/client-file-load-port.interface';
import {
  ItemStoreLoadPort,
  ItemStoreLoadPortToken,
} from '../../port/out/itemstore-load-port.interface';
import {
  ItemStoreSavePort,
  ItemStoreSavePortToken,
} from '../../port/out/itemstore-save-port.interface';
import { ItemStoreUseCase } from '../../port/in/itemstore-usecase-interface';

@Injectable()
export class ItemStoreService implements ItemStoreUseCase {
  constructor(
    @Inject(Logger)
    private readonly loggerService: LoggerService,
    @Inject(ClientFileLoadPortToken)
    private readonly clientFileLoadPort: ClientFileLoadPort,
    @Inject(ItemStoreLoadPortToken)
    private readonly itemStoreLoadPort: ItemStoreLoadPort,
    @Inject(ItemStoreSavePortToken)
    private readonly itemStoreSavePort: ItemStoreSavePort,
  ) {}

  async init() {
    const latestVersionDb =
      await this.itemStoreLoadPort.getLatestKoreanVersionFromDB();
    const latestVersionRemote =
      await this.clientFileLoadPort.getLatestKoreanVersionFromRemote();
    if (latestVersionDb && latestVersionDb.version >= latestVersionRemote)
      return;

    this.loggerService.log(`Found new version! - ${latestVersionRemote}`);

    await this.itemStoreSavePort.extracted(
      latestVersionRemote,
      latestVersionDb,
    );
  }
}
