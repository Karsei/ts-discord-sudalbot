import { AxiosError } from 'axios';
import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';

import { ArchiveFetchHelper } from './archive-fetch.helper';
import NewsCategories, {
  NewsCategoryGlobal,
  NewsCategoryKorea,
  NewsContent,
} from '../../../../definitions/archive.constant';
import GlobalErrorReport, {
  ErrorLevel,
} from '../../../../helpers/global-error-report.helper';

@Injectable()
export class ArchiveService {
  /**
   * 수정 확인을 위한 Cache 유지 시간
   */
  static readonly CACHE_EXPIRE_IN = 600;

  private readonly redis: Redis;

  constructor(
    @Inject(Logger) private readonly loggerService: LoggerService,
    private readonly redisService: RedisService,
  ) {
    this.redis = this.redisService.getClient();
  }

  /**
   * 글로벌 서비스의 특정 카테고리의 소식을 조회합니다.
   * @param type 카테고리
   * @param locale 언어
   * @param isSkipCache Cache 사용 여부
   */
  async getGlobal(
    type: NewsCategoryGlobal,
    locale: string,
    isSkipCache: boolean = false,
  ): Promise<NewsContent[]> {
    let outdate = await this.isOutDate(type, locale);
    if (isSkipCache || outdate) {
      try {
        let data = await ArchiveFetchHelper.withGlobal(
          NewsCategories.Global[type].url,
          type,
          locale,
        );
        await this.setCache(JSON.stringify(data), type, locale);
        return data;
      } catch (e) {
        this.logMessage(
          'warn',
          '글로벌 소식을 가져오는 과정에서 오류가 발생했습니다.',
          e,
        );
        let data = await this.getCache(type, locale);
        return JSON.parse(data);
      }
    } else {
      let data = await this.getCache(type, locale);
      return JSON.parse(data);
    }
  }

  /**
   * 글로벌 서비스의 모든 카테고리 소식을 조회합니다.
   * @param locale
   */
  async getGlobalAll(locale: string): Promise<any[]> {
    // Promise.all 로 하면 429 오류가 뜨면서 요청이 많다고 뜨므로 하나씩 해주자
    let results = [];
    for (let idx in NewsCategoryGlobal) {
      results.push(
        await this.getGlobal(
          NewsCategoryGlobal[idx as keyof typeof NewsCategoryGlobal],
          locale,
        ),
      );
    }
    return results;
  }

  /**
   * 한국 서비스의 특정 카테고리 소식을 조회합니다.
   * @param type 카테고리
   * @param isSkipCache Cache 사용 여부
   */
  async getKorea(
    type: NewsCategoryKorea,
    isSkipCache: boolean = false,
  ): Promise<NewsContent[]> {
    let outdate = await this.isOutDate(type, 'kr');
    if (isSkipCache || outdate) {
      try {
        let data = await ArchiveFetchHelper.withKorea(
          NewsCategories.Korea[type].url,
          type,
        );
        await this.setCache(JSON.stringify(data), type, 'kr');
        return data;
      } catch (e) {
        this.logMessage(
          'warn',
          '한국 소식을 가져오는 과정에서 오류가 발생했습니다.',
          e,
        );
        let data = await this.getCache(type, 'kr');
        return JSON.parse(data);
      }
    } else {
      let data = await this.getCache(type, 'kr');
      return JSON.parse(data);
    }
  }

  /**
   * 한국 서비스의 모든 카테고리 소식을 조회합니다.
   */
  async getKoreaAll(): Promise<any[]> {
    // Promise.all 로 하면 429 오류가 뜨면서 요청이 많다고 뜨므로 하나씩 해주자
    let results = [];
    for (let idx in NewsCategoryKorea) {
      results.push(
        await this.getKorea(
          NewsCategoryKorea[idx as keyof typeof NewsCategoryKorea],
        ),
      );
    }
    return results;
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
   * 소식 Cache 조회
   * @param type 타입
   * @param locale 언어
   */
  async getCache(type: string, locale: string): Promise<string> {
    return await this.redis.hget(`${locale}-news-data`, type);
  }

  /**
   * 소식 갱신 시간이 지났는지 확인
   * @param type 타입
   * @param locale 언어
   */
  async isOutDate(type: string, locale: string): Promise<boolean> {
    let timestamp = await this.redis.hget(`${locale}-news-timestamp`, type);
    let cacheTime = timestamp ? parseInt(timestamp) : new Date(0).getTime();
    return new Date().getTime() > cacheTime + ArchiveService.CACHE_EXPIRE_IN;
  }

  private async logMessage(level: ErrorLevel, title: string, error: Error) {
    if (error instanceof AxiosError) {
      GlobalErrorReport.report(level, title, error.message, error.stack);
    }
    if (level === 'warn') this.loggerService.warn(title, error);
    else if (level === 'error') this.loggerService.error(title, error);
  }
}
