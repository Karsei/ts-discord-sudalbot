import { PermissionsBitField, SelectMenuInteraction } from 'discord.js';
import {
  Inject,
  Injectable,
  Logger,
  LoggerService,
  Scope,
} from '@nestjs/common';
import { InteractionEventCollector, On, Once } from '@discord-nestjs/core';

import {
  NewsPublishCacheLoadPort,
  NewsPublishCacheLoadPortToken,
} from '../../../port/out/news-publish-cache-load-port.interface';
import {
  NewsPublishSavePort,
  NewsPublishSavePortToken,
} from '../../../port/out/news-publish-save-port.interface';

@Injectable({ scope: Scope.REQUEST })
@InteractionEventCollector({ time: 15000 })
export class NoticeCreatePostCollector {
  constructor(
    @Inject(Logger)
    private readonly loggerService: LoggerService,
    @Inject(NewsPublishCacheLoadPortToken)
    private readonly newsPublishCacheLoadPort: NewsPublishCacheLoadPort,
    @Inject(NewsPublishSavePortToken)
    private readonly newsPublishSavePort: NewsPublishSavePort,
  ) {}

  @On('collect')
  async onCollect(interaction: SelectMenuInteraction): Promise<void> {
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
      await interaction.deferUpdate();
      const hookUrl = await this.newsPublishCacheLoadPort.getHookUrlByGuildId(
        interaction.guildId || '',
      );
      //const selectId = interaction.customId;

      const values = interaction.values[0].split('||');
      const locale = values[0],
        topic = values[1];

      await this.newsPublishSavePort.addNewsWebhookUrl(
        interaction.guildId,
        locale,
        topic,
        hookUrl,
      );
      this.loggerService.log(
        `${interaction.guild} (${interaction.guildId}) - 언어: ${locale}, 카테고리: ${topic} - 소식을 추가하였습니다.`,
      );
      await interaction.editReply({
        content: '소식 추가에 성공했어요!',
        components: [],
      });
    } catch (e) {
      if (e instanceof Error) {
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

  @Once('end')
  onEnd(): void {
    //
  }
}
