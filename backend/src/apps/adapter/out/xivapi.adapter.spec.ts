import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { XivApiAdapter } from './xivapi.adapter';

describe('XivapiServiceTest', () => {
  let xivapiService: XivApiAdapter;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [Logger, ConfigService, XivApiAdapter],
    }).compile();
    xivapiService = app.get<XivApiAdapter>(XivApiAdapter);
  });

  it('fetchItem', async () => {
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
