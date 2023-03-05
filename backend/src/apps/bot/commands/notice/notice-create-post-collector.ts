import {
  Message,
  PermissionsBitField,
  SelectMenuInteraction,
} from 'discord.js';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { InjectRepository } from '@nestjs/typeorm';
import { Inject, Logger, LoggerService } from '@nestjs/common';
import { InteractionEventCollector, On, Once } from '@discord-nestjs/core';

import { News } from '../../../../entities/news.entity';

@InteractionEventCollector({ time: 15000 })
export class NoticeCreatePostCollector {
  private readonly redis: Redis;
  constructor(
    @Inject(Logger) private readonly loggerService: LoggerService,
    private readonly redisService: RedisService,
    @InjectRepository(News) private newsRepository: Repository<News>,
  ) {
    this.redis = this.redisService.getClient();
  }

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
      const hookUrl = await this.getHookUrlByGuildId(interaction.guildId || '');
      const selectId = interaction.customId;

      const values = interaction.values[0].split('||');
      const locale = values[0],
        topic = values[1];

      await this.addUrl(interaction.guildId, locale, topic, hookUrl);
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

  /**
   * 서버 고유번호로 Webhook URL 조회
   *
   * @param pGuildId 서버 고유 번호
   * @return Webhook URL
   */
  private async getHookUrlByGuildId(pGuildId: string) {
    return this.redis.hget('all-guilds', pGuildId);
  }

  /**
   * 게시글별 Webhook URL Cache 등록
   *
   * @param guildId 서버 ID
   * @param locale 언어
   * @param type 카테고리
   * @param url Webhook URL
   */
  private async addUrl(
    guildId: string,
    locale: string,
    type: string,
    url: string,
  ) {
    await this.newsRepository.insert({
      guild: { id: guildId },
      locale: locale,
      type: type,
      url: url,
    });
    return this.redis.sadd(`${locale}-${type}-webhooks`, url);
  }

  @Once('end')
  onEnd(): void {
    //
  }
}
