import {Module, Logger, CacheModule} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as redisStore from 'cache-manager-ioredis';

import { HttpModule } from './apps/http/http.module';
import { BotModule } from './apps/bot/bot.module';

@Module({
  imports: [
    // For Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
      ignoreEnvFile: 'prod' === process.env.NODE_ENV,
    }),
    // For Cache
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB,
    }),
    // For HTTP
    HttpModule,
    // For Discord
    BotModule,
  ],
  providers: [Logger],
})
export class AppModule {}
