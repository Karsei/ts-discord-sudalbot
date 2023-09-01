import { Inject } from '@nestjs/common';
import { PermissionsBitField } from 'discord.js';
import { SlashCommandPipe } from '@discord-nestjs/common';
import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';

import { EchoDto } from '../../../bot/dtos/echo.dto';
import {
  EchoUseCase,
  EchoUseCaseToken,
} from '../../../port/in/echo-usecase.interface';

@Command({
  name: '따라하기',
  description: '봇이 사용자의 말을 똑같이 따라합니다.',
  dmPermission: false,
  defaultMemberPermissions: PermissionsBitField.Flags.ViewChannel,
})
export class EchoCommand {
  constructor(
    @Inject(EchoUseCaseToken)
    private readonly echoUseCase: EchoUseCase,
  ) {}

  /**
   * 명령어 핸들러
   * @param dto 따라하기 DTO
   */
  @Handler()
  handler(@InteractionEvent(SlashCommandPipe) dto: EchoDto): string {
    return this.echoUseCase.echo(dto.message);
  }
}
