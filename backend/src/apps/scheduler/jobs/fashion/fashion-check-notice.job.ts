import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { FashionCheckService } from '../../../bot/commands/fashion/fashioncheck.service';

@Injectable()
export class FashionCheckNoticeJob {
  constructor(
    @Inject(Logger) private readonly loggerService: LoggerService,
    private readonly fashionCheckService: FashionCheckService,
  ) {}

  @Cron('*/30 15-20 * * 4-6', {
    name: 'publish-fashion-check-notice',
    timeZone: 'Asia/Seoul',
  })
  async handleCron() {
    this.loggerService.log('execute fashion check publish');
    await this.fashionCheckService.publishAll();
  }
}
