import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { AxiosResponse } from 'axios';

import { WebhookPublishPort } from 'src/apps/port/out/webhook-publish-port.interface';

@Injectable()
export class DiscordWebhookAdapter implements WebhookPublishPort {
  constructor(
    @Inject(Logger)
    private readonly loggerService: LoggerService,
  ) {}

  async sendWebhook() {
    
  }
}
