import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DiscordModule } from '@discord-nestjs/core';
import { GatewayIntentBits } from 'discord.js';

import {BotGateway} from './bot.gateway';
import {EchoService} from './commands/echo/echo.service';
import {EchoCommand} from './commands/echo/echo.command';
import {UptimeService} from './commands/uptime/uptime.service';
import {UptimeCommand} from './commands/uptime/uptime.command';
import {FashionCheckService} from './commands/fashion/fashioncheck.service';
import {FashionCheckCommand} from './commands/fashion/fashioncheck.command';

@Module({
  imports: [
    DiscordModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        token: configService.get('DISCORD_BOT_TOKEN'),
        discordClientOptions: {
          intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMessageReactions,
            GatewayIntentBits.GuildVoiceStates,
          ],
        },
        registerCommandOptions: [
          {
            forGuild: configService.get('DISCORD_BOT_TEST_SERVER_ID'),
            removeCommandsBefore: true,
          },
        ],
        failOnLogin: true,
      }),
      inject: [ConfigService],
    }),
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
