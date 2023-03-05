import { Inject, Logger, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TransformPipe } from '@discord-nestjs/common';
import {
  Command,
  DiscordTransformedCommand,
  Payload,
  TransformedCommandExecutionContext,
  UsePipes,
} from '@discord-nestjs/core';

import { ShopInfoSearchDto } from '../../dtos/shop-info-search.dto';

@Command({
  name: '상점',
  description: '특정 아이템이 판매하는 곳의 정보를 보여줍니다.',
})
@UsePipes(TransformPipe)
export class ShopCommand
  implements DiscordTransformedCommand<ShopInfoSearchDto>
{
  constructor(
    private readonly configService: ConfigService,
    @Inject(Logger) private readonly loggerService: LoggerService,
  ) {}

  /**
   * 명령어 핸들러
   * @param dto 상점 검색 DTO
   * @param interaction 명령 상호작용
   */
  async handler(
    @Payload() dto: ShopInfoSearchDto,
    { interaction }: TransformedCommandExecutionContext,
  ): Promise<void> {
    try {
      await interaction.reply({
        content:
          '현재 데이터셋 리뉴얼 준비중이에요. 죄송하지만.. 나중에 이용해주세요.',
      });
    } catch (e) {
      this.loggerService.error('상점 응답 오류: ', e);
    }
  }
}
