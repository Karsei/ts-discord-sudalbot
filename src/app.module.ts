import { Module, Logger, CacheModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BaseConfig } from './configs/base.config';
import { CacheConfig } from './configs/cache.config';
import { TypeORMConfig } from './configs/typeorm.config';
import { HttpModule } from './apps/http/http.module';
import { BotModule } from './apps/bot/bot.module';


@Module({
  imports: [
    // For Config
    ConfigModule.forRoot(BaseConfig),
    // For Cache
    CacheModule.register(CacheConfig),
    // For TypeORM
    TypeOrmModule.forRootAsync(TypeORMConfig),
    // For HTTP
    HttpModule,
    // For Discord
    BotModule,
  ],
  providers: [Logger],
})
export class AppModule {}
