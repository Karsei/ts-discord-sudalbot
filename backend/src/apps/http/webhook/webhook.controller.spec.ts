import { RedisService } from '@liaoliaots/nestjs-redis';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Guild } from '../../../entities/guild.entity';
import { News } from '../../../entities/news.entity';
import { Repository } from 'typeorm';

import { SaveWebhookDto } from './dto/save-webhook.dto';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';

export type MockType<T> = {
  [P in keyof T]?: jest.Mock<{}>;
};

export const repositoryMockFactory: () => MockType<Repository<any>> = jest.fn(
  () => ({
    findOne: jest.fn((entity) => entity),
    // ...
  }),
);

let mockRedisSet;

const mockRedis = {
  set: mockRedisSet,
};

const mockRedisService = {
  getClient: jest.fn(() => mockRedis),
};

const mockWebhookService = {
  subscribe: jest.fn().mockResolvedValue({}),
};

describe('WebhookController', () => {
  let webhookController: WebhookController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        Logger,
        ConfigService,
        { provide: WebhookService, useValue: mockWebhookService },
        { provide: RedisService, useValue: mockRedisService },
        {
          provide: getRepositoryToken(Guild),
          useFactory: repositoryMockFactory,
        },
        {
          provide: getRepositoryToken(News),
          useFactory: repositoryMockFactory,
        },
      ],
    }).compile();

    webhookController = app.get<WebhookController>(WebhookController);
  });

  describe('root', () => {
    it('webhook test', async () => {
      const dto: SaveWebhookDto = {
        code: '',
        guild_id: '',
        permissions: 0,
      };
      const resParam = {
        send: jest.fn((str) => ''),
      };
      const res = await webhookController.save(dto, resParam);
      expect(res).toBe(undefined);
    });
  });
});
