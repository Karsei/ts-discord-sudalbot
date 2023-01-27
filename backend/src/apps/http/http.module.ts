import { Module, Logger } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SampleHealthIndicator } from './health/sample.health';
import { HealthController } from './health/health.controller';
import { WebhookController } from './webhook/webhook.controller';
import { WebhookService } from './webhook/webhook.service';
import { Guild } from '../../entities/guild.entity';
import { News } from '../../entities/news.entity';

@Module({
  imports: [TerminusModule, TypeOrmModule.forFeature([Guild, News])],
  controllers: [HealthController, WebhookController],
  providers: [Logger, SampleHealthIndicator, WebhookService],
})
export class HttpModule {}
