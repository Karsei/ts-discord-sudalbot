import { Message, PermissionsBitField, SelectMenuInteraction } from 'discord.js';
import Redis from 'ioredis';
import { Inject, Logger, LoggerService } from '@nestjs/common';
import { InteractionEventCollector, On, Once } from '@discord-nestjs/core';
import { RedisService } from '@liaoliaots/nestjs-redis';

@InteractionEventCollector({ time: 15000 })
export class NoticeDeletePostCollector {
    private readonly redis: Redis;
    constructor(@Inject(Logger) private readonly loggerService: LoggerService,
                private readonly redisService: RedisService) {
        this.redis = this.redisService.getClient();
    }

    @On('collect')
    async onCollect(interaction: SelectMenuInteraction): Promise<void> {
        const roles: any = interaction.member.permissions;
        if (!roles.has([PermissionsBitField.Flags.Administrator, PermissionsBitField.Flags.ManageMessages])) {
            await interaction.reply({ content: '관리자 또는 메세지 관리 권한이 없어서 이용할 수 없어요.', ephemeral: true });
            return;
        }

        try {
            await interaction.deferUpdate();
            const hookUrl = await this.getHookUrlByGuildId(interaction.guildId || '');
            const selectId = interaction.customId;

            const values = interaction.values[0].split("||");
            const locale = values[0], topic = values[1];

            await this.delUrl(locale, topic, hookUrl);
            this.loggerService.log(`${interaction.guild} (${interaction.guildId}) - 언어: ${locale}, 카테고리: ${topic} - 소식을 삭제하였습니다.`);
            await interaction.editReply({content: '소식 삭제에 성공했어요!', components: []});
        }
        catch (e) {
            if (e instanceof Error) {
                await interaction.editReply('오류가 발생해서 보여드릴 수 없네요.. 잠시 후에 다시 시도해보세요.');
                this.loggerService.error(e.stack);
                console.error(e);
            }
            else {
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
     * 게시글별 Webhook URL Cache 삭제
     *
     * @param pLocale 언어
     * @param pType 카테고리
     * @param pUrl Webhook URL
     */
    private async delUrl(pLocale: string, pType: string, pUrl: string) {
        return this.redis.srem(`${pLocale}-${pType}-webhooks`, pUrl);
    }

    @Once('end')
    onEnd(): void {
    }
}
