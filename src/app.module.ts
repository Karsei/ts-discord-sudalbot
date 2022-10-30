import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { HttpModule } from './http/http.module';
import { BotModule } from './bot/bot.module';

@Module({
  imports: [
    // For Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
      ignoreEnvFile: 'prod' === process.env.NODE_ENV,
    }),
    // For HTTP
    HttpModule,
    // For Discord
    BotModule,
  ],
  providers: [Logger],
})
export class AppModule {}
