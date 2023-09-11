import { Test, TestingModule } from '@nestjs/testing';

import { GithubAdapter } from './github.adapter';
import { Logger } from '@nestjs/common';

describe('GithubAdapterTest', () => {
  let githubAdapter: GithubAdapter;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [Logger, GithubAdapter],
    }).compile();
    githubAdapter = app.get<GithubAdapter>(GithubAdapter);
  });

  it('getLatestKoreanVersionFromRemote', async () => {
    // given

    // when
    const results = await githubAdapter.getLatestKoreanVersionFromRemote();

    // then
    expect(results).toBeDefined();
    expect(results).toBeGreaterThan(0);
  });

  it('fetchCsv', async () => {
    // given
    const fileName = 'ContentType';

    // when
    const results = await githubAdapter.fetch(fileName);

    // then
    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);
    expect(results[1]['#']).toEqual('1');
    expect(results[1]['Name']).toEqual('무작위 임무');
    expect(results[1]['Icon']).toEqual('61807');
  });
});
