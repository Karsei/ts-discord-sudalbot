import { Module, Logger, CacheModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { BaseConfig } from './configs/base.config';
import { CacheConfig } from './configs/cache.config';
import { HttpModule } from './apps/http/http.module';
import { BotModule } from './apps/bot/bot.module';

@Module({
  imports: [
    // For Config
    ConfigModule.forRoot(BaseConfig),
    // For Cache
    CacheModule.register(CacheConfig),
    // For HTTP
    HttpModule,
    // For Discord
    BotModule,
  ],
  providers: [Logger],
})
export class AppModule {}
