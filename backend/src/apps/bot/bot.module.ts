import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscordModule } from '@discord-nestjs/core';

import { DiscordConfig } from '../../configs/discord.config';
import { BotGateway } from './bot.gateway';
import { EchoService } from '../service/echo/echo.service';
import { EchoCommand } from '../adapter/in/command/echo.command';
import { UptimeService } from '../service/uptime/uptime.service';
import { UptimeCommand } from '../adapter/in/command/uptime.command';
import { ContactCommand } from '../adapter/in/command/contact.command';
import { FashionCheckService } from './commands/fashion/fashioncheck.service';
import { FashionCheckCommand } from './commands/fashion/fashioncheck.command';
import { FashionCheckNoticeJob } from '../scheduler/jobs/fashion/fashion-check-notice.job';
import { FashionCheckNoticeRegistCommand } from './commands/fashion/fashioncheck-notice-regist.command';
import { ItemSearchService } from './commands/item/item-search.service';
import { ItemSearchCommand } from './commands/item/item-search.command';
import { XivapiService } from './commands/item/xivapi.service';
import { Contact } from '../../entities/contact.entity';
import { XivVersion } from '../../entities/xiv-version.entity';
import { XivItem } from '../../entities/xiv-item.entity';
import { News } from '../../entities/news.entity';
import { Chat } from '../../entities/chat.entity';
import { FashionCheckNotice } from '../../entities/fashioncheck-notice.entity';
import { XivItemCategories } from '../../entities/xiv-item-categories.entity';
import { MarketService } from './commands/market/market.service';
import { MarketCommand } from './commands/market/market.command';
import { NoticeService } from './commands/notice/notice.service';
import { NoticeCreateCommand } from './commands/notice/notice-create.command';
import { NoticeDeleteCommand } from './commands/notice/notice-delete.command';
import { ItemSearchInteractionService } from './commands/item/item-search-interaction.service';
import { ShopCommand } from '../adapter/in/command/shop.command';
import { FashionCheckRedditLoadPortToken } from '../port/out/fashioncheck-reddit-load-port.interface';
import { RedditAdapter } from '../adapter/out/reddit.adapter';
import { UniversalisAdapter } from '../adapter/out/universalis.adapter';
import { UniversalisLoadPortToken } from '../port/out/universalis-load-port.interface';
import { EchoUseCaseToken } from '../port/in/echo-usecase.interface';
import { ContactSavePortToken } from '../port/out/contact-save-port.interface';
import { MariadbAdapter } from '../adapter/out/mariadb.adapter';
import { UptimeUseCaseToken } from '../port/in/uptime-usecase.interface';

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
    FashionCheckService,
    FashionCheckCommand,
    FashionCheckNoticeRegistCommand,
    FashionCheckNoticeJob,
    { provide: FashionCheckRedditLoadPortToken, useClass: RedditAdapter },
    ItemSearchService,
    ItemSearchCommand,
    ItemSearchInteractionService,
    XivapiService,
    MarketService,
    MarketCommand,
    MarketService,
    { provide: UniversalisLoadPortToken, useClass: UniversalisAdapter },
    NoticeService,
    NoticeCreateCommand,
    NoticeDeleteCommand,
    ShopCommand,
    { provide: ContactSavePortToken, useClass: MariadbAdapter },
  ],
})
export class BotModule {}
