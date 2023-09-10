import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common';

import { ArchiveFetchHelper } from './archive-fetch.helper';
import NewsCategories, {
  NewsCategoryGlobal,
  NewsCategoryKorea,
  NewsContent,
} from '../../../definitions/interface/archive';
import {
  NewsArchiveCacheLoadPort,
  NewsArchiveCacheLoadPortToken,
} from '../../port/out/news-archive-cache-load-port.interface';
import {
  NewsArchiveCacheSavePort,
  NewsArchiveCacheSavePortToken,
} from '../../port/out/news-archive-cache-save-port.interface';
import { NoticeArchiveUseCase } from '../../port/in/news-archive-usecase.interface';

@Injectable()
export class ArchiveService implements NoticeArchiveUseCase {
  constructor(
    @Inject(Logger)
    private readonly loggerService: LoggerService,
    @Inject(NewsArchiveCacheLoadPortToken)
    private readonly cacheLoadPort: NewsArchiveCacheLoadPort,
    @Inject(NewsArchiveCacheSavePortToken)
    private readonly cacheSavePort: NewsArchiveCacheSavePort,
  ) {}

  async getGlobal(
    type: NewsCategoryGlobal,
    locale: string,
    isSkipCache: boolean = false,
  ): Promise<NewsContent[]> {
    const outdate = await this.cacheLoadPort.isOutDate(type, locale);
    if (isSkipCache || outdate) {
      try {
        const data = await ArchiveFetchHelper.withGlobal(
          NewsCategories.Global[type].url,
          type,
          locale,
        );
        await this.cacheSavePort.setCache(JSON.stringify(data), type, locale);
        return data;
      } catch (e) {
        this.loggerService.error(
          '글로벌 소식을 가져오는 과정에서 오류가 발생했습니다.',
          e,
        );
        const data = await this.cacheLoadPort.getCache(type, locale);
        return JSON.parse(data);
      }
    } else {
      const data = await this.cacheLoadPort.getCache(type, locale);
      return JSON.parse(data);
    }
  }

  async getGlobalAll(locale: string): Promise<any[]> {
    // Promise.all 로 하면 429 오류가 뜨면서 요청이 많다고 뜨므로 하나씩 해주자
    const results = [];
    for (const idx in NewsCategoryGlobal) {
      results.push(
        await this.getGlobal(
          NewsCategoryGlobal[idx as keyof typeof NewsCategoryGlobal],
          locale,
        ),
      );
    }
    return results;
  }

  async getKorea(
    type: NewsCategoryKorea,
    isSkipCache: boolean = false,
  ): Promise<NewsContent[]> {
    const outdate = await this.cacheLoadPort.isOutDate(type, 'kr');
    if (isSkipCache || outdate) {
      try {
        const data = await ArchiveFetchHelper.withKorea(
          NewsCategories.Korea[type].url,
          type,
        );
        await this.cacheSavePort.setCache(JSON.stringify(data), type, 'kr');
        return data;
      } catch (e) {
        this.loggerService.error(
          '한국 소식을 가져오는 과정에서 오류가 발생했습니다.',
          e,
        );
        const data = await this.cacheLoadPort.getCache(type, 'kr');
        return JSON.parse(data);
      }
    } else {
      const data = await this.cacheLoadPort.getCache(type, 'kr');
      return JSON.parse(data);
    }
  }

  async getKoreaAll(): Promise<any[]> {
    // Promise.all 로 하면 429 오류가 뜨면서 요청이 많다고 뜨므로 하나씩 해주자
    const results = [];
    for (const idx in NewsCategoryKorea) {
      results.push(
        await this.getKorea(
          NewsCategoryKorea[idx as keyof typeof NewsCategoryKorea],
        ),
      );
    }
    return results;
  }
}
