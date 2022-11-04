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
import { Contact } from '../../entities/contact.entity';

@Module({
  imports: [
    DiscordModule.forRootAsync(DiscordConfig),
    DiscordModule.forFeature(),
    TypeOrmModule.forFeature([Contact]),
  ],
  providers: [
    Logger,
    BotGateway,
    EchoService, EchoCommand,
    UptimeService, UptimeCommand,
    ContactCommand,
    FashionCheckService, FashionCheckCommand
  ]
})
export class BotModule {}
