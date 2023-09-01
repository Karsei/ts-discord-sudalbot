import { Test, TestingModule } from '@nestjs/testing';

import { EchoService } from './echo.service';

describe('EchoService', () => {
  let echoService: EchoService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [EchoService],
    }).compile();
    echoService = app.get<EchoService>(EchoService);
  });

  it('echo', async () => {
    // given
    const str = '테스트';

    // when
    const echoed = echoService.echo('테스트');

    // then
    expect(echoed).toBeDefined();
    expect(echoed).toEqual(str);
  });
});
