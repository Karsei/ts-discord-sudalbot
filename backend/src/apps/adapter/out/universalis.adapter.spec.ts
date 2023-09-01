import { Test, TestingModule } from '@nestjs/testing';

import { UniversalisAdapter } from './universalis.adapter';

describe('UniversalisAdapterTest', () => {
  let universalisAdapter: UniversalisAdapter;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [UniversalisAdapter],
    }).compile();
    universalisAdapter = app.get<UniversalisAdapter>(UniversalisAdapter);
  });

  it('fetchCurrentList', async () => {
    // given
    const server = 'chocobo';
    const itemId = 4551;

    // when
    const results = await universalisAdapter.fetchCurrentList(server, itemId);

    // then
    expect(results).toBeDefined();
  });
});
