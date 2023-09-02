import { Client, CommandInteraction, PermissionsBitField } from 'discord.js';
import { Inject, Logger, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Command, Handler, InjectDiscordClient } from '@discord-nestjs/core';

import {
  FashionCheckUseCase,
  FashionCheckUseCaseToken,
} from '../../../port/in/fashioncheck-usecase.interface';

@Command({
  name: '패션체크',
  description:
    '이번 주의 패션체크를 확인합니다. 글로벌/한국 서비스 모두 동일합니다.',
  dmPermission: false,
  defaultMemberPermissions: PermissionsBitField.Flags.ViewChannel,
})
export class FashionCheckCommand {
  constructor(
    @InjectDiscordClient() private readonly client: Client,
    @Inject(Logger) private readonly loggerService: LoggerService,
    private readonly configService: ConfigService,
    @Inject(FashionCheckUseCaseToken)
    private readonly service: FashionCheckUseCase,
  ) {}

  /**
   * 명령어 핸들러
   * @param interaction 명령 상호작용
   */
  @Handler()
  async handler(interaction: CommandInteraction): Promise<void> {
    // 응답 대기 전송
    try {
      await interaction.deferReply();
    } catch (e) {
      this.loggerService.error('패션체크 defer 실패: ', e);
      return;
    }

    // 패션체크 메시지 전송
    this.service
      .getFashion()
      .then(async (fashionInfo) => {
        const embedMsg = this.service.makeTopicMessage(fashionInfo);
        await interaction.editReply({ embeds: [embedMsg] });
      })
      .catch(async (err) => {
        await interaction.editReply(
          '오류가 발생해서 보여드릴 수 없네요.. 잠시 후에 다시 시도해보세요.',
        );
        this.loggerService.error(err);
        console.error(err);
      });
  }
}
