import { Module, Logger } from '@nestjs/common';
import { DiscordModule } from '@discord-nestjs/core';
import { GatewayIntentBits } from 'discord.js';

import { DiscordConfig } from '../../configs/discord.config';
import { BotGateway } from './bot.gateway';
import { EchoService } from './commands/echo/echo.service';
import { EchoCommand } from './commands/echo/echo.command';
import { UptimeService } from './commands/uptime/uptime.service';
import { UptimeCommand } from './commands/uptime/uptime.command';
import { FashionCheckService } from './commands/fashion/fashioncheck.service';
import { FashionCheckCommand } from './commands/fashion/fashioncheck.command';

@Module({
  imports: [
    DiscordModule.forRootAsync(DiscordConfig),
    DiscordModule.forFeature(),
  ],
  providers: [
    Logger,
    BotGateway,
    EchoService, EchoCommand,
    UptimeService, UptimeCommand,
    FashionCheckService, FashionCheckCommand
  ]
})
export class BotModule {}
