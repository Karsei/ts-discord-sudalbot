import Redis from 'ioredis';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { Injectable } from '@nestjs/common';

import { FashionCheckCacheLoadPort } from '../../port/out/fashioncheck-cache-load-port.interface';
import { FashionCheckCacheSavePort } from '../../port/out/fashioncheck-cache-save-port.interface';
import { ManagedWebhook } from '../../service/fashioncheck/fashioncheck.service';
import { NoticeCacheLoadPort } from '../../port/out/notice-cache-load-port.interface';
import { NoticeCacheSavePort } from '../../port/out/notice-cache-save-port.interface';

@Injectable()
export class RedisAdapter
  implements
    FashionCheckCacheLoadPort,
    FashionCheckCacheSavePort,
    NoticeCacheLoadPort,
    NoticeCacheSavePort
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
}
