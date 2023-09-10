import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import {
  NewsPublishUseCase,
  NewsPublishUseCaseToken,
} from '../../../port/in/news-publish-usecase.interface';

@Injectable()
export class NewsJob {
  constructor(
    @Inject(Logger)
    private readonly loggerService: LoggerService,
    @Inject(NewsPublishUseCaseToken)
    private readonly publishService: NewsPublishUseCase,
  ) {}

  @Cron('5,15,25,35,45,55 * * * *', {
    name: 'publish-archives',
    timeZone: 'Asia/Seoul',
  })
  async handleCron() {
    this.loggerService.log('execute publish');
    await this.publishService.publishAll();
  }

  @Cron('0,10,20,30,40,50 * * * *', {
    name: 'publish-archives-resend',
    timeZone: 'Asia/Seoul',
  })
  async handleResendCron() {
    this.loggerService.log('execute resend publish');
    await this.publishService.publishResendAll();
  }
}
