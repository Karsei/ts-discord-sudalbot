import { Test, TestingModule } from '@nestjs/testing';

import { UptimeService } from './uptime.service';

describe('UptimeService', () => {
  let uptimeService: UptimeService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [UptimeService],
    }).compile();
    uptimeService = app.get<UptimeService>(UptimeService);
  });

  it('fetchTime', async () => {
    // given

    // when
    const result = uptimeService.fetchTime();

    // then
    expect(result).toBeDefined();
  });
});
