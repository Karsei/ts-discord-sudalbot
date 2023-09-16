import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscordModule } from '@discord-nestjs/core';

import { DiscordConfig } from '../configs/discord.config';
import { BotGateway } from './bot.gateway';
import { EchoService } from './service/echo/echo.service';
import { EchoCommand } from './adapter/in/command/echo.command';
import { UptimeService } from './service/uptime/uptime.service';
import { UptimeCommand } from './adapter/in/command/uptime.command';
import { ContactCommand } from './adapter/in/command/contact.command';
import { FashionCheckService } from './service/fashioncheck/fashioncheck.service';
import { FashionCheckCommand } from './adapter/in/command/fashioncheck.command';
import { FashionCheckNoticeJob } from './adapter/in/scheduler/fashion-check-notice.job';
import { FashionCheckNoticeRegistCommand } from './adapter/in/command/fashioncheck-notice-regist.command';
import { ItemSearchService } from './service/item/item-search.service';
import { ItemSearchCommand } from './adapter/in/command/item-search.command';
import { XivApiAdapter } from './adapter/out/xivapi.adapter';
import { Contact } from '../entities/contact.entity';
import { XivVersion } from '../entities/xiv-version.entity';
import { XivItem } from '../entities/xiv-item.entity';
import { News } from '../entities/news.entity';
import { Chat } from '../entities/chat.entity';
import { FashionCheckNotice } from '../entities/fashioncheck-notice.entity';
import { XivItemCategories } from '../entities/xiv-item-categories.entity';
import { MarketService } from './service/market/market.service';
import { MarketCommand } from './adapter/in/command/market.command';
import { NoticeService } from './service/news/notice.service';
import { NoticeCreateCommand } from './adapter/in/command/notice-create.command';
import { NoticeDeleteCommand } from './adapter/in/command/notice-delete.command';
import { ItemSearchInteractionService } from './service/item/item-search-interaction.service';
import { ShopCommand } from './adapter/in/command/shop.command';
import { FashionCheckRedditLoadPortToken } from './port/out/fashioncheck-reddit-load-port.interface';
import { RedditAdapter } from './adapter/out/reddit.adapter';
import { UniversalisAdapter } from './adapter/out/universalis.adapter';
import { UniversalisLoadPortToken } from './port/out/universalis-load-port.interface';
import { EchoUseCaseToken } from './port/in/echo-usecase.interface';
import { ContactSavePortToken } from './port/out/contact-save-port.interface';
import { MariadbAdapter } from './adapter/out/mariadb.adapter';
import { UptimeUseCaseToken } from './port/in/uptime-usecase.interface';
import { FashionCheckDbLoadPortToken } from './port/out/fashioncheck-db-load-port.interface';
import { FashionCheckDbSavePortToken } from './port/out/fashioncheck-db-save-port.interface';
import { FashionCheckCacheLoadPortToken } from './port/out/fashioncheck-cache-load-port.interface';
import { RedisAdapter } from './adapter/out/redis.adapter';
import { FashionCheckCacheSavePortToken } from './port/out/fashioncheck-cache-save-port.interface';
import { FashionCheckLoadPortToken } from './port/out/fashioncheck-load-port.interface';
import { DbCacheAdapter } from './adapter/out/dbcache.adapter';
import { FashionCheckSavePortToken } from './port/out/fashioncheck-save-port.interface';
import { FashionCheckUseCaseToken } from './port/in/fashioncheck-usecase.interface';
import { FashionCheckNoticeUseCaseToken } from './port/in/fashioncheck-notice-usecase.interface';
import { MarketUseCaseToken } from './port/in/market-usecase.interface';
import { NewsUseCaseToken } from './port/in/news-usecase.interface';
import { XivApiLoadPortToken } from './port/out/xivapi-load-port.interface';
import { ItemSearchUseCaseToken } from './port/in/item-search-usecase.interface';
import { ItemSearchInteractionUseCaseToken } from './port/in/item-search-interaction-usecase.interface';
import { NewsPublishSavePortToken } from './port/out/news-publish-save-port.interface';
import { NewsPublishDbSavePortToken } from './port/out/news-publish-db-save-port.interface';
import { NewsPublishCacheSavePortToken } from './port/out/news-publish-cache-save-port.interface';
import { NewsPublishCacheLoadPortToken } from './port/out/news-publish-cache-load-port.interface';
import { ItemStoreLoadPortToken } from './port/out/itemstore-load-port.interface';
import { ItemStoreSavePortToken } from './port/out/itemstore-save-port.interface';
import { ClientFileLoadPortToken } from './port/out/client-file-load-port.interface';
import { GithubAdapter } from './adapter/out/github.adapter';
import { LodestoneLoadPortToken } from './port/out/lodestone-load-port.interface';
import { OfficialSiteAdapter } from './adapter/out/official-site.adapter';
import { NewsPublishDbLoadPortToken } from "./port/out/news-publish-db-load-port.interface";

@Module({
  imports: [
    DiscordModule.forRootAsync(DiscordConfig),
    DiscordModule.forFeature(),
    TypeOrmModule.forFeature([
      Contact,
      XivVersion,
      XivItem,
      XivItemCategories,
      News,
      Chat,
      FashionCheckNotice,
    ]),
  ],
  providers: [
    Logger,
    BotGateway,
    EchoCommand,
    { provide: EchoUseCaseToken, useClass: EchoService },
    UptimeCommand,
    { provide: UptimeUseCaseToken, useClass: UptimeService },
    ContactCommand,
    FashionCheckCommand,
    FashionCheckNoticeRegistCommand,
    FashionCheckNoticeJob,
    { provide: FashionCheckUseCaseToken, useClass: FashionCheckService },
    { provide: FashionCheckNoticeUseCaseToken, useClass: FashionCheckService },
    { provide: FashionCheckRedditLoadPortToken, useClass: RedditAdapter },
    ItemSearchCommand,
    { provide: ItemSearchUseCaseToken, useClass: ItemSearchService },
    {
      provide: ItemSearchInteractionUseCaseToken,
      useClass: ItemSearchInteractionService,
    },
    {
      provide: LodestoneLoadPortToken,
      useClass: OfficialSiteAdapter,
    },
    { provide: XivApiLoadPortToken, useClass: XivApiAdapter },
    MarketCommand,
    { provide: MarketUseCaseToken, useClass: MarketService },
    { provide: UniversalisLoadPortToken, useClass: UniversalisAdapter },
    NoticeCreateCommand,
    NoticeDeleteCommand,
    { provide: NewsUseCaseToken, useClass: NoticeService },
    ShopCommand,
    { provide: ItemStoreLoadPortToken, useClass: MariadbAdapter },
    { provide: ItemStoreSavePortToken, useClass: MariadbAdapter },
    { provide: NewsPublishSavePortToken, useClass: DbCacheAdapter },
    { provide: NewsPublishDbLoadPortToken, useClass: MariadbAdapter },
    { provide: NewsPublishDbSavePortToken, useClass: MariadbAdapter },
    { provide: NewsPublishCacheLoadPortToken, useClass: RedisAdapter },
    { provide: NewsPublishCacheSavePortToken, useClass: RedisAdapter },
    { provide: FashionCheckLoadPortToken, useClass: DbCacheAdapter },
    { provide: FashionCheckSavePortToken, useClass: DbCacheAdapter },
    { provide: FashionCheckCacheLoadPortToken, useClass: RedisAdapter },
    { provide: FashionCheckCacheSavePortToken, useClass: RedisAdapter },
    { provide: FashionCheckDbLoadPortToken, useClass: MariadbAdapter },
    { provide: FashionCheckDbSavePortToken, useClass: MariadbAdapter },
    { provide: ContactSavePortToken, useClass: MariadbAdapter },
    { provide: ClientFileLoadPortToken, useClass: GithubAdapter },
  ],
})
export class BotModule {}
