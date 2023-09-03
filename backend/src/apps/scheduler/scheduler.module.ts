import { Module, Logger } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NewsJob } from './jobs/news/news.job';
import { ArchiveService } from './jobs/news/archive.service';
import { PublishService } from './jobs/news/publish.service';
import { PublishDiscordService } from './jobs/news/publish-discord.service';
import { XivVersion } from '../../entities/xiv-version.entity';
import { XivItem } from '../../entities/xiv-item.entity';
import { XivItemCategories } from '../../entities/xiv-item-categories.entity';
import { ItemJob } from '../adapter/in/scheduler/item.job';
import { ItemStoreService } from '../service/item/item-store.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([XivVersion, XivItem, XivItemCategories]),
  ],
  providers: [
    Logger,
    NewsJob,
    PublishService,
    PublishDiscordService,
    ArchiveService,
    ItemJob,
    ItemStoreService,
  ],
})
export class SchedulerModule {}
