import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscordModule } from '@discord-nestjs/core';
import { GatewayIntentBits } from 'discord.js';

import { DiscordConfig } from '../../configs/discord.config';
import { BotGateway } from './bot.gateway';
import { EchoService } from './commands/echo/echo.service';
import { EchoCommand } from './commands/echo/echo.command';
import { UptimeService } from './commands/uptime/uptime.service';
import { UptimeCommand } from './commands/uptime/uptime.command';
import { ContactCommand } from './commands/contact/contact.command';
import { FashionCheckService } from './commands/fashion/fashioncheck.service';
import { FashionCheckCommand } from './commands/fashion/fashioncheck.command';
import { ItemSearchService} from './commands/item/item-search.service';
import { ItemSearchCommand} from './commands/item/item-search.command';
import { XivapiService } from './commands/item/xivapi.service';
import { Contact } from '../../entities/contact.entity';
import { XivVersion } from '../../entities/xiv-version.entity';
import { XivItem } from '../../entities/xiv-item.entity';
import { XivItemCategories } from '../../entities/xiv-item-categories.entity';
import { MarketService} from './commands/market/market.service';
import { MarketCommand } from './commands/market/market.command';
import { UniversalisService } from './commands/market/universalis.service';

@Module({
  imports: [
    DiscordModule.forRootAsync(DiscordConfig),
    DiscordModule.forFeature(),
    TypeOrmModule.forFeature([Contact, XivVersion, XivItem, XivItemCategories]),
  ],
  providers: [
    Logger,
    BotGateway,
    EchoService, EchoCommand,
    UptimeService, UptimeCommand,
    ContactCommand,
    FashionCheckService, FashionCheckCommand,
    ItemSearchService, ItemSearchCommand, XivapiService,
    MarketService, MarketCommand, MarketService, UniversalisService,
  ]
})
export class BotModule {}
