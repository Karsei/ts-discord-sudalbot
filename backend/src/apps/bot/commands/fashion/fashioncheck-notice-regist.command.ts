import { Inject, Logger, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Command, DiscordTransformedCommand } from '@discord-nestjs/core';
import {
  ContextMenuCommandInteraction,
  DiscordAPIError,
  EmbedBuilder,
  PermissionsBitField,
} from 'discord.js';

import { FashionCheckService } from './fashioncheck.service';
import { FashionCheckError } from '../../../../exceptions/fashion-check.exception';

@Command({
  name: '패션체크소식등록',
  description: '패션체크소식을 자동으로 전달받도록 합니다!',
})
export class FashionCheckNoticeRegistCommand
  implements DiscordTransformedCommand<any>
{
  constructor(
    @Inject(Logger) private readonly loggerService: LoggerService,
    private readonly configService: ConfigService,
    private readonly fashionCheckService: FashionCheckService,
  ) {}

  /**
   * 명령어 핸들러
   * @param interaction 명령 상호작용
   */
  async handler(interaction: ContextMenuCommandInteraction): Promise<void> {
    // 권한 확인
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

    // 응답 대기 전송
    try {
      await interaction.deferReply();
    } catch (e) {
      this.loggerService.error('패션체크 소식 등록 defer 실패: ', e);
      return;
    }

    try {
      // 웹후크 기록 찾음
      const managedWebhook = await this.fashionCheckService.getWebhook(
        interaction.guildId,
      );
      // 기록은 있으나 그래도 현재 서버에 남아있는지 확인함
      const webhooks = await interaction.guild.fetchWebhooks();
      const filtered = webhooks.filter(
        (webhook) => webhook.token === managedWebhook.webhookToken,
      );
      if (filtered.size > 0) {
        await interaction.editReply(
          '이미 소식을 받고 있어요! 다시 등록하고 싶으시다면 `서버 설정 > 연동 > 달달이`에 들어가셔서 웹후크에 있는 `달달이 패션체크`를 삭제하고 다시 진행해주세요.',
        );
      } else {
        this.createWebhook(interaction);
      }
    } catch (err) {
      if (err instanceof FashionCheckError) {
        this.createWebhook(interaction);
      } else if (err instanceof DiscordAPIError) {
        if (err.code === 50013) {
          await interaction.editReply(
            '권한이 없어요! 아마 새로 생긴 기능이라서 그럴 거에요. 봇을 추방하고 다시 초대해주세요!',
          );
        } else {
          await interaction.editReply(
            '오류가 발생해서 보여드릴 수 없네요.. 잠시 후에 다시 시도해보세요.',
          );
          this.loggerService.error(err);
          console.error(err);
        }
      } else {
        await interaction.editReply(
          '오류가 발생해서 보여드릴 수 없네요.. 잠시 후에 다시 시도해보세요.',
        );
        this.loggerService.error(err);
        console.error(err);
      }
    }
  }

  private createWebhook(interaction: ContextMenuCommandInteraction) {
    interaction.guild.channels
      .createWebhook({
        channel: interaction.channelId,
        name: '달달이 패션체크',
        avatar:
          'https://cdn.discordapp.com/avatars/589775904163627026/f235dc93edba16f1bf154f8807ff602f.webp?size=256',
        reason: '패션체크 소식 수동 등록',
      })
      .then(async (webhook) => {
        // 캐시 및 DB 저장
        await this.fashionCheckService.setWebhook({
          guildId: webhook.guildId,
          webhookId: webhook.id,
          webhookToken: webhook.token,
          channelId: interaction.channelId,
        });
        this.loggerService.log(
          `패션체크 소식 등록 성공 (길드: ${interaction.guild.name}[${webhook.guildId}], ID: ${webhook.id}, TOKEN: ${webhook.token})`,
        );

        // 사용자에게 전송
        const embedMsg = this.makeSuccessMessage();
        await interaction.editReply({ embeds: [embedMsg] });
      })
      .catch(async (err) => {
        if (err instanceof DiscordAPIError) {
          if (err.code === 50013) {
            await interaction.editReply(
              '권한이 없어요! 아마 새로 생긴 기능이라서 그럴 거에요. 봇을 추방하고 다시 초대해주세요!',
            );
          } else {
            await interaction.editReply(
              '오류가 발생해서 보여드릴 수 없네요.. 잠시 후에 다시 시도해보세요.',
            );
            this.loggerService.error(err);
            console.error(err);
          }
        } else {
          await interaction.editReply(
            '오류가 발생해서 보여드릴 수 없네요.. 잠시 후에 다시 시도해보세요.',
          );
          this.loggerService.error(err);
          console.error(err);
        }
      });
  }

  /**
   * Embed 메시지 생성
   * @private
   */
  private makeSuccessMessage() {
    return new EmbedBuilder()
      .setColor('#fc03f4')
      .setTitle(`패션체크 소식 등록 성공`)
      .setDescription(`앞으로 이 채널에 소식이 계속 등록될거에요!`)
      .setTimestamp(new Date())
      .setThumbnail(
        'https://styles.redditmedia.com/t5_c3dzb/styles/profileIcon_ugxkdcpuxbp51.png?width=256&height=256&crop=256:256,smart&s=a1f754e55d562256c326bbc97302bc7d895e3806',
      )
      .setFooter({
        text: this.configService.get('APP_NAME'),
      });
  }
}
