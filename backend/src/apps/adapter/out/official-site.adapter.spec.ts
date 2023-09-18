import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';

import { OfficialSiteAdapter } from './official-site.adapter';

describe('OficialSiteAdapterTest', () => {
  let officialSiteAdapter: OfficialSiteAdapter;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [Logger, OfficialSiteAdapter],
    }).compile();
    officialSiteAdapter = app.get<OfficialSiteAdapter>(OfficialSiteAdapter);
  });

  it('searchItemUrl', async () => {
    // given

    // when
    const results = await officialSiteAdapter.searchItemUrl('코크스');

    // then
    expect(results).toBeDefined();
    expect(results).toEqual(
      'https://guide.ff14.co.kr/lodestone/db/item/d22736e2233',
    );
  });

  it('searchItemUrlNotFound', async () => {
    // given

    // when
    const results = await officialSiteAdapter.searchItemUrl('에헤라디야');

    // then
    expect(results).toBeDefined();
    expect(results).toEqual('');
  });
});
