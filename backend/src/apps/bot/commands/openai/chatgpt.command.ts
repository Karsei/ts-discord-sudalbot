import { Inject, Logger, LoggerService } from "@nestjs/common";
import { TransformPipe } from '@discord-nestjs/common';
import {
  Command,
  DiscordTransformedCommand,
  Payload,
  TransformedCommandExecutionContext,
  UsePipes,
} from '@discord-nestjs/core';

import { ChatGptService } from './chatgpt.service';
import { ChatGptDto } from '../../dtos/chatgpt.dto';

@Command({
  name: '대화하기',
  description:
    'GPT-3 모델을 이용하여 달달이와 대화합니다. (영어로 해야 정확성이 높으며, 응답 시간이 조금 늦을 수 있습니다)',
})
@UsePipes(TransformPipe)
export class ChatGptCommand implements DiscordTransformedCommand<ChatGptDto> {
  constructor(
    private readonly chatGptService: ChatGptService,
    @Inject(Logger) private readonly loggerService: LoggerService,
  ) {}

  /**
   * 명령어 핸들러
   * @param dto GPT DTO
   * @param interaction 명령 상호작용
   */
  async handler(
    @Payload() dto: ChatGptDto,
    { interaction }: TransformedCommandExecutionContext,
  ) {
    // 응답 대기 전송
    try {
      await interaction.deferReply();
    }
    catch (e) {
      this.loggerService.error('GPT defer 오류: ', e);
      return;
    }

    try {
      const res = await this.chatGptService.converse(
        interaction.guildId,
        interaction.user.id,
        dto.message,
      );
      await interaction.editReply(res);
    }
    catch (e) {
      this.loggerService.error('GPT 응답 오류: ', e);
    }
  }
}
