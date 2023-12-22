import { Module, Logger } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SampleHealthIndicator } from './adapter/in/http/sample.health';
import { HealthController } from './adapter/in/http/health.controller';
import { WebhookController } from './adapter/in/http/webhook.controller';
import { WebhookService } from './service/webhook/webhook.service';
import { Guild } from '../entities/guild.entity';
import { News } from '../entities/news.entity';
import { RedisAdapter } from './adapter/out/redis.adapter';
import { NewsPublishCacheLoadPortToken } from './port/out/news-publish-cache-load-port.interface';
import { NewsPublishCacheSavePortToken } from './port/out/news-publish-cache-save-port.interface';
import { MariadbAdapter } from './adapter/out/mariadb.adapter';
import { NewsPublishDbLoadPortToken } from './port/out/news-publish-db-load-port.interface';
import { NewsPublishDbSavePortToken } from './port/out/news-publish-db-save-port.interface';
import { Contact } from '../entities/contact.entity';
import { XivVersion } from '../entities/xiv-version.entity';
import { XivItem } from '../entities/xiv-item.entity';
import { XivItemCategories } from '../entities/xiv-item-categories.entity';
import { FashionCheckNotice } from '../entities/fashioncheck-notice.entity';
import { Chat } from '../entities/chat.entity';
import {ClientFileLoadPortToken} from "./port/out/client-file-load-port.interface";
import {GithubAdapter} from "./adapter/out/github.adapter";

@Module({
  imports: [
    TerminusModule,
    TypeOrmModule.forFeature([
      Chat,
      Contact,
      XivVersion,
      XivItem,
      XivItemCategories,
      Guild,
      News,
      FashionCheckNotice,
    ]),
  ],
  controllers: [HealthController, WebhookController],
  providers: [
    Logger,
    SampleHealthIndicator,
    WebhookService,
    { provide: NewsPublishCacheLoadPortToken, useClass: RedisAdapter },
    { provide: NewsPublishCacheSavePortToken, useClass: RedisAdapter },
    { provide: NewsPublishDbLoadPortToken, useClass: MariadbAdapter },
    { provide: NewsPublishDbSavePortToken, useClass: MariadbAdapter },
    { provide: ClientFileLoadPortToken, useClass: GithubAdapter },
  ],
})
export class HttpModule {}
