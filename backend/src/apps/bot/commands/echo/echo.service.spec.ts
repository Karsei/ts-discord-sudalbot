import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { EchoService } from './echo.service';

describe('EchoService', () => {
  let echoService: EchoService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [Logger, ConfigService, EchoService],
    }).compile();
    echoService = app.get<EchoService>(EchoService);
  });

  it('getEchoCanBeSameWithMsg', async () => {
    // given
    const str = '테스트';

    // when
    const echoed = echoService.getEcho('테스트');

    // then
    expect(echoed).toBeDefined();
    expect(echoed).toEqual(str);
  });
});
