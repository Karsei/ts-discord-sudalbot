import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { HelloController } from './hello/hello.controller';
import { HelloService } from './hello/hello.service';
import { SampleHealthIndicator } from './health/sample.health';
import { HealthController } from './health/health.controller';

@Module({
  imports: [TerminusModule],
  controllers: [HelloController, HealthController],
  providers: [HelloService, SampleHealthIndicator],
})
export class HttpModule {}
