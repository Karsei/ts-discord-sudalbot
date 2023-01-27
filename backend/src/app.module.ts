import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@liaoliaots/nestjs-redis';

import { BaseConfig } from './configs/base.config';
import { CacheConfig } from './configs/cache.config';
import { TypeORMConfig } from './configs/typeorm.config';
import { HttpModule } from './apps/http/http.module';
import { BotModule } from './apps/bot/bot.module';
import { SchedulerModule } from './apps/scheduler/scheduler.module';

@Module({
  imports: [
    // For Config
    ConfigModule.forRoot(BaseConfig),
    // For Cache
    RedisModule.forRootAsync(CacheConfig),
    // For TypeORM
    TypeOrmModule.forRootAsync(TypeORMConfig),
    // For HTTP
    HttpModule,
    // For Discord
    BotModule,
    // For Scheduler
    SchedulerModule,
  ],
  providers: [Logger],
})
export class AppModule {}
