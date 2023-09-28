import { EmbedBuilder } from 'discord.js';

export interface WebhookPublishPort {
  /**
   * 웹훅을 호출하여 실행합니다.
   * @param url Webhook 주소
   * @param post Embed 로 만들어진 게시글 객체
   */
  sendWebhook(url: string, post: { embeds: EmbedBuilder[] });
}

export const WebhookPublishPortToken = Symbol('WebhookPublishPort');
