import { Guild } from '../../../entities/guild.entity';

export interface NewsPublishDbLoadPort {
  /**
   * 소식을 현재 구독중인지 확인
   * @param locale 언어
   * @param type 카테고리
   * @param url Webhook URL
   */
  checkExistWebhookNews(
    locale: string,
    type: string,
    url: string,
  ): Promise<boolean>;

  /**
   * 서버 정보를 조회합니다.
   * @param guildId 서버 ID
   */
  getGuild(guildId: string): Promise<Guild>;
}

export const NewsPublishDbLoadPortToken = Symbol('NewsPublishDbLoadPort');
