import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';

import { MarketService } from './market.service';
import { UniversalisLoadPortToken } from '../../port/out/universalis-load-port.interface';
import { ItemSearchUseCaseToken } from '../../port/in/item-search-usecase.interface';
import {
  SearchResultDetail,
  SearchResultHistory,
} from '../../adapter/out/universalis.adapter';

describe('MarketServiceTest', () => {
  let marketService: MarketService;
  const mockUniversalis = {
    fetchCurrentList: jest.fn(),
  };
  const mockItemSearch = {
    fetchSearchItem: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        Logger,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'APP_NAME') {
                return '달달이봇';
              }
              return null;
            }),
          },
        },
        MarketService,
        { provide: UniversalisLoadPortToken, useValue: mockUniversalis },
        { provide: ItemSearchUseCaseToken, useValue: mockItemSearch },
      ],
    }).compile();
    marketService = app.get<MarketService>(MarketService);

    mockUniversalis.fetchCurrentList.mockClear();
    mockItemSearch.fetchSearchItem.mockClear();
  });

  it('getInfo', async () => {
    // given
    const server = 'chocobo';
    const keyword = 'potion';

    jest.spyOn(mockItemSearch, 'fetchSearchItem').mockResolvedValue({
      id: 12345,
      name: 'Battleliege Bracelet of Aiming',
    });
    jest.spyOn(mockUniversalis, 'fetchCurrentList').mockResolvedValue({
      data: {
        listings: [
          {
            hq: false,
            quantity: 99,
            retainerName: '홍길동',
            materia: [],
            total: 99000,
            pricePerUnit: 1000,
          } as SearchResultDetail,
          {
            hq: false,
            quantity: 10,
            retainerName: '홍길동2',
            materia: [],
            total: 5000,
            pricePerUnit: 500,
          } as SearchResultDetail,
        ],
        recentHistory: [
          {
            timestamp: new Date().valueOf(),
            hq: false,
            quantity: 99,
            total: 99000,
            pricePerUnit: 1000,
          } as SearchResultHistory,
          {
            timestamp: new Date().valueOf(),
            hq: false,
            quantity: 10,
            total: 5000,
            pricePerUnit: 500,
          } as SearchResultHistory,
        ],
        averagePrice: 52000,
        minPriceNQ: 5000,
        maxPriceNQ: 99000,
        minPriceHQ: 0,
        maxPriceHQ: 0,
        lastUploadTime: new Date().valueOf(),
      },
    });

    // when
    const results = await marketService.getInfo(server, keyword);

    // then
    expect(results).toBeDefined();
    expect(results.data.title).toEqual('Battleliege Bracelet of Aiming');
    expect(results.data.url).toEqual('https://universalis.app/market/12345');
  });

  it('getInfoErrorWithNoData', async () => {
    // given
    const server = 'chocobo';
    const keyword = 'potion';

    jest.spyOn(mockItemSearch, 'fetchSearchItem').mockResolvedValue({
      id: 12345,
      name: 'Battleliege Bracelet of Aiming',
    });
    jest.spyOn(mockUniversalis, 'fetchCurrentList').mockResolvedValue({
      data: {
        listings: [],
      },
    });

    // when & then
    await expect(marketService.getInfo(server, keyword)).rejects.toThrow(
      '시장에 등록된 아이템이 없어요.',
    );
  });
});
