import { Module, Logger } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { SampleHealthIndicator } from './health/sample.health';
import { HealthController } from './health/health.controller';
import { WebhookController } from './webhook/webhook.controller';
import { WebhookService } from './webhook/webhook.service';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController, WebhookController],
  providers: [Logger, SampleHealthIndicator, WebhookService],
})
export class HttpModule {}
