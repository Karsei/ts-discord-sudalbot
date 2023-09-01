import { Inject, Logger, LoggerService } from '@nestjs/common';
import { Command, Handler } from '@discord-nestjs/core';
import { ContextMenuCommandInteraction, PermissionsBitField } from 'discord.js';

import {
  UptimeUseCase,
  UptimeUseCaseToken,
} from '../../../port/in/uptime-usecase.interface';

@Command({
  name: '업타임',
  description: '서버 로드로부터 경과된 시간을 출력합니다.',
  dmPermission: false,
  defaultMemberPermissions: PermissionsBitField.Flags.ViewChannel,
})
export class UptimeCommand {
  constructor(
    @Inject(Logger) private readonly loggerService: LoggerService,
    @Inject(UptimeUseCaseToken)
    private readonly uptimeService: UptimeUseCase,
  ) {}

  /**
   * 명령어 핸들러
   * @param interaction 명령 상호작용
   */
  @Handler()
  async handler(interaction: ContextMenuCommandInteraction) {
    try {
      await interaction.reply(
        `서버가 실행된 후 ${this.uptimeService.fetchTime()} 가 경과했습니다.`,
      );
    } catch (e) {
      this.loggerService.error('업타임 응답 오류: ', e);
    }
  }
}
