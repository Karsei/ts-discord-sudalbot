import { SlashCommandPipe } from '@discord-nestjs/common';
import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';

import { EchoService } from './echo.service';
import { EchoDto } from '../../dtos/echo.dto';

@Command({
  name: '따라하기',
  description: '봇이 사용자의 말을 똑같이 따라합니다.',
})
export class EchoCommand {
  constructor(private readonly echoService: EchoService) {}

  /**
   * 명령어 핸들러
   * @param dto 따라하기 DTO
   */
  @Handler()
  handler(@InteractionEvent(SlashCommandPipe) dto: EchoDto): string {
    return this.echoService.getEcho(dto.message);
  }
}
