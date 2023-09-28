import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { DiscordWebhookAdapter } from './discord-webhook.adapter';

const PromiseAdv = require('bluebird');

describe('DiscordWebhookAdapterTest', () => {
  let discordWebhookAdapter: DiscordWebhookAdapter;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [Logger, DiscordWebhookAdapter],
    }).compile();
    discordWebhookAdapter = app.get<DiscordWebhookAdapter>(
      DiscordWebhookAdapter,
    );
  });
});
