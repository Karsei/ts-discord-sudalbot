import { ClientEvents, PermissionsBitField } from 'discord.js';
import { Inject, Logger, LoggerService } from '@nestjs/common';
import { SlashCommandPipe } from '@discord-nestjs/common';
import {
  Command,
  EventParams,
  Handler,
  InteractionEvent,
} from '@discord-nestjs/core';

import { ItemSearchError } from '../../../../exceptions/item-search.exception';
import { MarketError } from '../../../../exceptions/market.exception';
import { MarketSearchDto } from '../../dtos/market-search.dto';
import { ItemSearchTooManyResultsError } from '../../../../exceptions/item-search-too-many-results.exception';
import {
  MarketUseCase,
  MarketUseCaseToken,
} from '../../../port/in/market-usecase.interface';

@Command({
  name: '시장',
  description:
    '서버 기준으로 현재 시장에 등록되어 있는 특정 아이템의 목록을 조회합니다. (글로벌 전용)',
  dmPermission: false,
  defaultMemberPermissions: PermissionsBitField.Flags.ViewChannel,
})
export class MarketCommand {
  constructor(
    @Inject(Logger)
    private readonly loggerService: LoggerService,
    @Inject(MarketUseCaseToken)
    private readonly marketService: MarketUseCase,
  ) {}

  /**
   * 명령어 핸들러
   * @param dto 시장 검색 DTO
   * @param args
   */
  @Handler()
  async handler(
    @InteractionEvent(SlashCommandPipe) dto: MarketSearchDto,
    @EventParams() args: ClientEvents['interactionCreate'],
  ): Promise<void> {
    const [interaction] = args;
    if (!interaction.isChatInputCommand()) return;

    // 응답 대기 전송
    try {
      await interaction.deferReply();
    } catch (e) {
      this.loggerService.error('시장 defer 오류: ', e);
      return;
    }

    try {
      // 시장 검색 후 메시지 생성
      const embedMsg = await this.marketService.getInfo(
        dto.server,
        dto.keyword,
      );

      await interaction.editReply({ embeds: [embedMsg] });
    } catch (e) {
      if (
        e instanceof MarketError ||
        e instanceof ItemSearchError ||
        e instanceof ItemSearchTooManyResultsError
      ) {
        await interaction.editReply(e.message);
      } else if (e instanceof Error) {
        await interaction.editReply(
          '오류가 발생해서 보여드릴 수 없네요.. 잠시 후에 다시 시도해보세요.',
        );
        this.loggerService.error(e.stack);
        console.error(e);
      } else {
        this.loggerService.error(e);
        console.error(e);
      }
    }
  }
}
