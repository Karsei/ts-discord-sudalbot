import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { PublishService } from './publish.service';

@Injectable()
export class NewsJob {
    constructor(@Inject(Logger) private readonly loggerService: LoggerService,
                private readonly publishService: PublishService) {
    }

    @Cron('5,15,30,25,35,45,55 * * * *', {
        name: 'publish-archives',
        timeZone: 'Asia/Seoul',
    })
    async handleCron() {
        this.loggerService.log('execute publish');
        const res = await this.publishService.publishAll();
        console.log(res);
    }
}