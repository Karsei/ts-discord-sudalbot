import { Module, Logger } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { NewsJob } from './jobs/news/news.job';
import { ArchiveService } from './jobs/news/archive.service';
import { PublishService } from './jobs/news/publish.service';
import { PublishDiscordService } from './jobs/news/publish-discord.service';

@Module({
    imports: [
        ScheduleModule.forRoot(),
    ],
    providers: [ Logger, NewsJob, PublishService, PublishDiscordService, ArchiveService ],
})
export class SchedulerModule {}