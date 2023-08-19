import { ConfigModule, ConfigService } from '@nestjs/config';
import { GatewayIntentBits } from 'discord.js';

export const DiscordConfig = {
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    token: configService.get('DISCORD_BOT_TOKEN'),
    discordClientOptions: {
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
      ],
    },
    registerCommandOptions: [
      {
        //forGuild: configService.get('DISCORD_BOT_TEST_SERVER_ID'),
        removeCommandsBefore: true,
      },
    ],
    failOnLogin: true,
  }),
  inject: [ConfigService],
};
