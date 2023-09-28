import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import axios from 'axios';
import { EmbedBuilder } from 'discord.js';

import { WebhookPublishPort } from 'src/apps/port/out/webhook-publish-port.interface';

const PromiseAdv = require('bluebird');

@Injectable()
export class DiscordWebhookAdapter implements WebhookPublishPort {
  constructor(
    @Inject(Logger)
    private readonly loggerService: LoggerService,
  ) {}

  async sendWebhook(url: string, post: { embeds: EmbedBuilder[] }) {
    const res = await axios({
      method: 'POST',
      url: url,
      headers: {
        'Content-Type': 'application/json',
      },
      data: post,
    });

    // 너무 많이 보낸 경우 미리 딜레이를 줌
    await this.delayIfManyRequests(res);

    return res;
  }

  private async delayIfManyRequests(res) {
    if (res.headers['x-ratelimit-remaining'] == '0') {
      const time =
        parseInt(res.headers['x-ratelimit-reset']) * 1000 -
        new Date().getTime();
      if (time > 0) {
        await PromiseAdv.delay(time + 1000);
      }
    }
  }
}
