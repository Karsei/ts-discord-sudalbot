import { Client, ClientEvents, Message, PermissionsBitField } from 'discord.js';
import { Inject, Logger, LoggerService, UseInterceptors } from '@nestjs/common';
import { CollectorInterceptor, SlashCommandPipe } from '@discord-nestjs/common';
import {
  Command,
  EventParams,
  Handler,
  InjectDiscordClient,
  InteractionEvent,
  UseCollectors,
} from '@discord-nestjs/core';

import { NoticeService } from './notice.service';
import { NoticeDeletePostCollector } from './notice-delete-post-collector';
import { NoticeManageDto } from '../../dtos/notice-manage.dto';
import { NoticeError } from '../../../../exceptions/notice.exception';

@Command({
  name: '소식삭제',
  description: '현재 서버에서 구독중인 소식 카테고리 중 하나를 삭제합니다.',
})
@UseInterceptors(CollectorInterceptor)
@UseCollectors(NoticeDeletePostCollector)
export class NoticeDeleteCommand {
  constructor(
    @InjectDiscordClient() private readonly client: Client,
    @Inject(Logger) private readonly loggerService: LoggerService,
    private readonly noticeService: NoticeService,
  ) {}

  @Handler()
  async handler(
    @InteractionEvent(SlashCommandPipe) dto: NoticeManageDto,
    @EventParams() args: ClientEvents['interactionCreate'],
  ) {
    const [interaction] = args;
    if (!interaction.isChatInputCommand()) return;

    const roles: any = interaction.member.permissions;
    if (
      !roles.has([
        PermissionsBitField.Flags.Administrator,
        PermissionsBitField.Flags.ManageMessages,
      ])
    ) {
      await interaction.reply({
        content: '관리자 또는 메세지 관리 권한이 없어서 이용할 수 없어요.',
        ephemeral: true,
      });
      return;
    }

    try {
      await interaction.deferReply({ ephemeral: true });
      const selectComponent = await this.noticeService.makeComponent(
        dto.locale,
        interaction.guild.id,
        true,
      );

      const editedMsg = await interaction.editReply({
        content: '삭제할 소식을 선택해주세요.',
        components: [selectComponent],
      });
      if (!(editedMsg instanceof Message)) return;

      setTimeout(async () => {
        const fetchMsg = await interaction.fetchReply();
        if (!(fetchMsg instanceof Message)) return;
        if (fetchMsg.editedTimestamp != null) return;

        await interaction.editReply({
          content: '시간이 꽤 지나서 다시 명령어를 이용해주세요.',
          components: [],
        });
      }, 15000);
    } catch (e) {
      if (e instanceof NoticeError) {
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
