import { EmbedBuilder } from 'discord.js';
import Redis from 'ioredis';
import { RedisService } from '@songkeys/nestjs-redis';
import { Injectable } from '@nestjs/common';

import { FashionCheckCacheLoadPort } from '../../port/out/fashioncheck-cache-load-port.interface';
import { FashionCheckCacheSavePort } from '../../port/out/fashioncheck-cache-save-port.interface';
import { ManagedWebhook } from '../../service/fashioncheck/fashioncheck.service';
import { NewsArchiveCacheLoadPort } from '../../port/out/news-archive-cache-load-port.interface';
import { NewsArchiveCacheSavePort } from '../../port/out/news-archive-cache-save-port.interface';
import { NewsPublishCacheLoadPort } from '../../port/out/news-publish-cache-load-port.interface';
import { NewsPublishCacheSavePort } from '../../port/out/news-publish-cache-save-port.interface';
import { NewsContent } from '../../../definitions/interface/archive';

@Injectable()
export class RedisAdapter
  implements
    FashionCheckCacheLoadPort,
    FashionCheckCacheSavePort,
    NewsArchiveCacheLoadPort,
    NewsArchiveCacheSavePort,
    NewsPublishCacheLoadPort,
    NewsPublishCacheSavePort
{
  /**
   * 수정 확인을 위한 Cache 유지 시간
   */
  static readonly CACHE_EXPIRE_IN = 600;

  private readonly redis: Redis;

  constructor(private readonly redisService: RedisService) {
    this.redis = this.redisService.getClient();
  }

  async getFashionCheckNoticeWebhookGuildIds() {
    return this.redis.hkeys('fashion-check-notice');
  }

  /**
   * 패션 체크 소식 등록이 되어 있는 길드 정보를 조회합니다.
   * @param guildId 서버 ID
   */
  async getFashionCheckNoticeWebhook(guildId: string): Promise<ManagedWebhook> {
    const cache = await this.redis.hget('fashion-check-notice', guildId);
    if (cache != null) return JSON.parse(cache);
    return null;
  }

  /**
   * 패션 체크 소식 등록을 위한 길드 정보를 저장합니다.
   * @param webhook 웹훅 정보
   */
  async setFashionCheckNoticeWebhook(webhook: ManagedWebhook): Promise<number> {
    return this.redis.hset(
      'fashion-check-notice',
      webhook.guildId,
      JSON.stringify({
        guildId: webhook.guildId,
        webhookId: webhook.webhookId,
        webhookToken: webhook.webhookToken,
        channelId: webhook.channelId,
      }),
    );
  }

  async delFashionCheckNoticeWebhook(webhook: ManagedWebhook): Promise<number> {
    return this.redis.hdel('fashion-check-notice', webhook.guildId);
  }

  async isExistFashionCheckTopic(topicId: string): Promise<number> {
    return this.redis.sismember('fashion-check-topic', topicId);
  }

  async setFashionCheckTopic(topicId: string): Promise<number> {
    return this.redis.sadd('fashion-check-topic', topicId);
  }

  /**
   * 소식 Cache 조회
   * @param type 타입
   * @param locale 언어
   */
  async getCache(type: string, locale: string): Promise<string> {
    return await this.redis.hget(`${locale}-news-data`, type);
  }

  /**
   * 소식 Cache 설정
   * @param news 데이터
   * @param type 타입
   * @param locale 언어
   */
  async setCache(news: string, type: string, locale: string): Promise<void> {
    this.redis.hset(`${locale}-news-data`, type, news);
    this.redis.hset(`${locale}-news-timestamp`, type, new Date().getTime());
  }

  /**
   * 소식 갱신 시간이 지났는지 확인
   * @param type 타입
   * @param locale 언어
   */
  async isOutDate(type: string, locale: string): Promise<boolean> {
    const timestamp = await this.redis.hget(`${locale}-news-timestamp`, type);
    const cacheTime = timestamp ? parseInt(timestamp) : new Date(0).getTime();
    return new Date().getTime() > cacheTime + RedisAdapter.CACHE_EXPIRE_IN;
  }

  async getNewsGuildWebhooks(typeStr: string, locale: string) {
    return this.redis.smembers(`${locale}-${typeStr}-webhooks`);
  }

  async addNewsId(post: NewsContent, typeStr: string, locale: string) {
    return this.redis.sadd(`${locale}-${typeStr}-ids`, post.idx);
  }

  /**
   * 소식 다시 보낼 객체 삽입
   *
   * @param url Webhook URL
   * @param post 데이터
   * @param locale 언어
   * @param type 카테고리
   */
  async addResendItem(
    url: string,
    post: { embeds: EmbedBuilder[] },
    locale: string,
    type: string,
  ) {
    return this.redis.lpush(
      'webhooks-news-resend',
      JSON.stringify({ url: url, body: post, locale: locale, type: type }),
    );
  }

  /**
   * 게시글별 Webhook URL Cache 삭제
   *
   * @param locale 언어
   * @param type 카테고리
   * @param url Webhook URL
   */
  async delUrl(locale: string, type: string, url: string) {
    return this.redis.srem(`${locale}-${type}-webhooks`, url);
  }

  /**
   * 소식 다시 보낼 Webhook URL과 데이터가 있는 객체의 개수 조회
   */
  async getResendItemLength() {
    return this.redis.llen('webhooks-news-resend');
  }

  /**
   * 소식 다시 보낼 Webhook URL과 데이터가 있는 객체 꺼냄
   *
   * @return url, body가 있는 객체
   */
  async popResendItem() {
    return this.redis.lpop('webhooks-news-resend');
  }

  /**
   * 서버 고유번호로 Webhook URL 조회
   *
   * @param guildId 서버 고유 번호
   * @return Webhook URL
   */
  async getHookUrlByGuildId(guildId: string) {
    return this.redis.hget('all-guilds', guildId);
  }

  /**
   * 게시글별 Webhook URL Cache 등록
   *
   * @param guildId 서버 ID
   * @param locale 언어
   * @param type 카테고리
   * @param url Webhook URL
   */
  async addNewsWebhookUrl(
    guildId: string,
    locale: string,
    type: string,
    url: string,
  ) {
    return this.redis.sadd(`${locale}-${type}-webhooks`, url);
  }

  /**
   * 게시글별 Webhook URL Cache 삭제
   *
   * @param guildId 서버 ID
   * @param locale 언어
   * @param type 카테고리
   * @param url Webhook URL
   */
  async delNewsWebhookUrl(
    guildId: string,
    locale: string,
    type: string,
    url: string,
  ) {
    return this.redis.srem(`${locale}-${type}-webhooks`, url);
  }

  /**
   * 모든 서버 Webhook 목록에 해당 url이 있는지 확인
   *
   * @param pUrl Webhook URL
   */
  async checkInAllWebhooks(pUrl: string) {
    return this.redis.sismember(`all-webhooks`, pUrl);
  }

  /**
   * 모든 서버 고유번호 목록에 등록
   *
   * @param guildId Discord 서버 고유번호
   * @param url Webhook URL
   */
  async addGuildsAll(guildId: string, url: string) {
    return this.redis.hset('all-guilds', guildId, url);
  }

  /**
   * 모든 서버 Webhook 목록에 등록
   *
   * @param pUrl Webhook URL
   */
  async addUrlAll(pUrl: string) {
    return this.redis.sadd(`all-webhooks`, pUrl);
  }

  async addWebhookNews(
    guildId: string,
    locale: string,
    type: string,
    url: string,
  ) {
    return this.redis.sadd(`${locale}-${type}-webhooks`, url);
  }

  async checkInWebhook(pLocale: string, pType: string, pUrl: string) {
    return this.redis.sismember(`${pLocale}-${pType}-webhooks`, pUrl);
  }
}
