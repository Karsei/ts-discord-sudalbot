import { ClientEvents, PermissionsBitField } from 'discord.js';
import { Inject, Logger, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Command,
  EventParams,
  Handler,
  InteractionEvent,
} from '@discord-nestjs/core';
import { SlashCommandPipe } from '@discord-nestjs/common';

import { ShopInfoSearchDto } from '../../../bot/dtos/shop-info-search.dto';

@Command({
  name: '상점',
  description: '특정 아이템이 판매하는 곳의 정보를 보여줍니다.',
  dmPermission: false,
  defaultMemberPermissions: PermissionsBitField.Flags.ViewChannel,
})
export class ShopCommand {
  constructor(
    private readonly configService: ConfigService,
    @Inject(Logger) private readonly loggerService: LoggerService,
  ) {}

  /**
   * 명령어 핸들러
   * @param dto 상점 검색 DTO
   * @param args
   */
  @Handler()
  async handler(
    @InteractionEvent(SlashCommandPipe) dto: ShopInfoSearchDto,
    @EventParams() args: ClientEvents['interactionCreate'],
  ): Promise<void> {
    try {
      const [interaction] = args;
      if (!interaction.isChatInputCommand()) return;

      await interaction.reply(
        '현재 데이터셋 리뉴얼 준비중이에요. 죄송하지만.. 나중에 이용해주세요.',
      );
    } catch (e) {
      this.loggerService.error('상점 응답 오류: ', e);
    }
  }
}
