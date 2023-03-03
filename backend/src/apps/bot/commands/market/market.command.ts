import { Inject, Logger, LoggerService } from '@nestjs/common';
import { TransformPipe } from '@discord-nestjs/common';
import {
  Command,
  DiscordTransformedCommand,
  Payload,
  TransformedCommandExecutionContext,
  UsePipes,
} from '@discord-nestjs/core';

import { ItemSearchError } from '../../../../exceptions/item-search.exception';
import { MarketError } from '../../../../exceptions/market.exception';
import { MarketService } from './market.service';
import { MarketSearchDto } from '../../dtos/market-search.dto';
import { ItemSearchTooManyResultsError } from '../../../../exceptions/item-search-too-many-results.exception';

@Command({
  name: '시장',
  description:
    '서버 기준으로 현재 시장에 등록되어 있는 특정 아이템의 목록을 조회합니다. (글로벌 전용)',
})
@UsePipes(TransformPipe)
export class MarketCommand
  implements DiscordTransformedCommand<MarketSearchDto>
{
  constructor(
    @Inject(Logger) private readonly loggerService: LoggerService,
    private readonly marketService: MarketService,
  ) {}

  /**
   * 명령어 핸들러
   * @param dto 시장 검색 DTO
   * @param interaction 명령 상호작용
   */
  async handler(
    @Payload() dto: MarketSearchDto,
    { interaction }: TransformedCommandExecutionContext,
  ): Promise<void> {
    // 응답 대기 전송
    try {
      await interaction.deferReply();
    }
    catch (e) {
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
