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

  it('fetchSearch', async () => {
    // given
    const index = 'Item';
    const keyword = 'Coke';

    // when
    const itemInfo = await xivapiService.fetchSearch(index, keyword);

    // then
    expect(itemInfo).toBeDefined();
    expect(itemInfo.data.Results).toBeDefined();
    expect(itemInfo.data.Pagination).toBeDefined();
    expect(itemInfo.data.Results[0].ID).toBeDefined();
    expect(itemInfo.data.Results[0].ID).toEqual(5530);
    expect(itemInfo.data.Results[0].Icon).toBeDefined();
    expect(itemInfo.data.Results[0].Icon).toEqual('/i/021000/021462.png');
    expect(itemInfo.data.Results[0].Name).toBeDefined();
    expect(itemInfo.data.Results[0].Name).toEqual('Coke');
    expect(itemInfo.data.Results[0].Url).toBeDefined();
    expect(itemInfo.data.Results[0].Url).toEqual('/Item/5530');
    expect(itemInfo.data.Results[0].UrlType).toBeDefined();
    expect(itemInfo.data.Results[0].UrlType).toEqual('Item');
  });

  it('fetchInstance', async () => {
    // given
    const id = 1;

    // when
    const instanceInfo = await xivapiService.fetchInstance(id);

    // then
    expect(instanceInfo).toBeDefined();
    expect(instanceInfo.data).toBeDefined();
    expect(instanceInfo.data.Name).toEqual('the Thousand Maws of Toto–Rak');
    expect(instanceInfo.data.Patch).toEqual(2);
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
