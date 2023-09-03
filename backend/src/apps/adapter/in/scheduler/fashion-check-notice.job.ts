import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import {
  FashionCheckNoticeUseCase,
  FashionCheckNoticeUseCaseToken,
} from '../../../port/in/fashioncheck-notice-usecase.interface';

@Injectable()
export class FashionCheckNoticeJob {
  constructor(
    @Inject(Logger)
    private readonly loggerService: LoggerService,
    @Inject(FashionCheckNoticeUseCaseToken)
    private readonly useCase: FashionCheckNoticeUseCase,
  ) {}

  @Cron('*/30 15-20 * * 4-6', {
    name: 'publish-fashion-check-notice',
    timeZone: 'Asia/Seoul',
  })
  async handleCron() {
    this.loggerService.log('execute fashion check publish');
    await this.useCase.publishAll();
  }
}
