import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { SampleHealthIndicator } from './sample.health';

@Controller('health-check')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly sampleHealthIndicator: SampleHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  getHealth() {
    return this.health.check([() => this.sampleHealthIndicator.isHealthy('')]);
  }
}
