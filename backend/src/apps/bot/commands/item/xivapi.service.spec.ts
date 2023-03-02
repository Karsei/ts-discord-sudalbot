import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { XivapiService } from './xivapi.service';

describe('XivapiService', () => {
  let xivapiService: XivapiService;

  const mockXivapiService = {
    subscribe: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [Logger, ConfigService, XivapiService],
    }).compile();
    xivapiService = app.get<XivapiService>(XivapiService);
  });

  it('fetchItemCanBeRetrieved', async () => {
    // given
    const itemId = 12345;

    // when
    const itemInfo = await xivapiService.fetchItem(itemId);

    // then
    expect(itemInfo).toBeDefined();
    expect(itemInfo.status).toEqual(200);
    expect(itemInfo.data).toBeDefined();
    expect(itemInfo.data.hasOwnProperty('Name')).toEqual(true);
    expect(itemInfo.data.Name).toEqual('Battleliege Bracelet of Aiming');
  });
});
