import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import {
  ItemStoreUseCase,
  ItemStoreUseCaseToken,
} from '../../../port/in/itemstore-usecase-interface';

@Injectable()
export class ItemJob {
  constructor(
    @Inject(Logger)
    private readonly loggerService: LoggerService,
    @Inject(ItemStoreUseCaseToken)
    private readonly itemStoreService: ItemStoreUseCase,
  ) {}

  @Cron('30 23 * * *', {
    name: 'item-store',
    timeZone: 'Asia/Seoul',
  })
  async handleCron() {
    this.loggerService.log('-- Started Store XIV Items');
    try {
      await this.itemStoreService.init();
    } catch (e) {
      this.loggerService.error(e);
      console.error(e);
    }
    this.loggerService.log('-- Ended Store XIV Items');
  }
}
