import { Module, Logger } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NewsJob } from './adapter/in/scheduler/news.job';
import { ArchiveService } from './service/news/archive.service';
import { PublishService } from './service/news/publish.service';
import { PublishDiscordService } from './service/news/publish-discord.service';
import { XivVersion } from '../entities/xiv-version.entity';
import { XivItem } from '../entities/xiv-item.entity';
import { XivItemCategories } from '../entities/xiv-item-categories.entity';
import { ItemJob } from './adapter/in/scheduler/item.job';
import { ItemStoreService } from './service/item/item-store.service';
import { ItemStoreUseCaseToken } from './port/in/itemstore-usecase-interface';
import { ItemStoreLoadPortToken } from './port/out/itemstore-load-port.interface';
import { ItemStoreSavePortToken } from './port/out/itemstore-save-port.interface';
import { ClientFileLoadPortToken } from './port/out/client-file-load-port.interface';
import { MariadbAdapter } from './adapter/out/mariadb.adapter';
import { GithubAdapter } from './adapter/out/github.adapter';
import { NewsArchiveUseCaseToken } from './port/in/news-archive-usecase.interface';
import { NewsArchiveCacheLoadPortToken } from './port/out/news-archive-cache-load-port.interface';
import { RedisAdapter } from './adapter/out/redis.adapter';
import { NewsArchiveCacheSavePortToken } from './port/out/news-archive-cache-save-port.interface';
import { NewsPublishUseCaseToken } from './port/in/news-publish-usecase.interface';
import { NewsPublishCacheLoadPortToken } from './port/out/news-publish-cache-load-port.interface';
import { NewsPublishCacheSavePortToken } from './port/out/news-publish-cache-save-port.interface';
import { NewsPublishDiscordUseCaseToken } from './port/in/news-publish-discord-usecase.interface';
import { Contact } from '../entities/contact.entity';
import { FashionCheckNotice } from '../entities/fashioncheck-notice.entity';
import { News } from '../entities/news.entity';
import { Guild } from '../entities/guild.entity';
import { Chat } from '../entities/chat.entity';
import { WebhookPublishPortToken } from './port/out/webhook-publish-port.interface';
import { DiscordWebhookAdapter } from './adapter/out/discord-webhook.adapter';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      Contact,
      XivVersion,
      XivItem,
      XivItemCategories,
      News,
      Guild,
      Chat,
      FashionCheckNotice,
    ]),
  ],
  providers: [
    Logger,
    NewsJob,
    {
      provide: NewsPublishDiscordUseCaseToken,
      useClass: PublishDiscordService,
    },
    { provide: NewsPublishUseCaseToken, useClass: PublishService },
    { provide: NewsPublishCacheLoadPortToken, useClass: RedisAdapter },
    { provide: NewsPublishCacheSavePortToken, useClass: RedisAdapter },
    { provide: NewsArchiveUseCaseToken, useClass: ArchiveService },
    { provide: NewsArchiveCacheLoadPortToken, useClass: RedisAdapter },
    { provide: NewsArchiveCacheSavePortToken, useClass: RedisAdapter },
    { provide: WebhookPublishPortToken, useClass: DiscordWebhookAdapter },
    ItemJob,
    { provide: ItemStoreUseCaseToken, useClass: ItemStoreService },
    { provide: ClientFileLoadPortToken, useClass: GithubAdapter },
    { provide: ItemStoreLoadPortToken, useClass: MariadbAdapter },
    { provide: ItemStoreSavePortToken, useClass: MariadbAdapter },
  ],
})
export class SchedulerModule {}
