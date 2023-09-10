import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmbedBuilder } from 'discord.js';

import NewsCategories, {
  LodestoneLocales,
  NewsCategoryContents,
  NewsCategoryGlobal,
  NewsCategoryKorea,
  NewsContent,
} from '../../../definitions/interface/archive';
import { PublishDiscordService } from './publish-discord.service';
import { NewsPublishUseCase } from '../../port/in/news-publish-usecase.interface';
import {
  NewsArchiveUseCase,
  NewsArchiveUseCaseToken,
} from '../../port/in/news-archive-usecase.interface';
import {
  NewsPublishCacheLoadPort,
  NewsPublishCacheLoadPortToken,
} from '../../port/out/news-publish-cache-load-port.interface';
import {
  NewsPublishCacheSavePort,
  NewsPublishCacheSavePortToken,
} from '../../port/out/news-publish-cache-save-port.interface';

const PromiseAdv = require('bluebird');

@Injectable()
export class PublishService implements NewsPublishUseCase {
  constructor(
    @Inject(Logger)
    private readonly loggerService: LoggerService,
    private readonly configService: ConfigService,
    @Inject(NewsPublishCacheLoadPortToken)
    private readonly cacheLoadPort: NewsPublishCacheLoadPort,
    @Inject(NewsPublishCacheSavePortToken)
    private readonly cacheSavePort: NewsPublishCacheSavePort,
    @Inject(NewsArchiveUseCaseToken)
    private readonly archiveService: NewsArchiveUseCase,
    private readonly publishDiscordService: PublishDiscordService,
  ) {}

  async publishAll() {
    const jobs = [];

    // 글로벌
    const globalTypes = Object.keys(NewsCategories.Global);
    for (const locale of LodestoneLocales) {
      for (const idx in globalTypes) {
        const type = globalTypes[idx];
        jobs.push(
          await PromiseAdv.delay(1000).return(
            this.publishGlobal(type as NewsCategoryGlobal, locale),
          ),
        );
      }
    }
    // 한국
    const koreaTypes = Object.keys(NewsCategories.Korea);
    for (const idx in koreaTypes) {
      const type = koreaTypes[idx];
      jobs.push(
        await PromiseAdv.delay(1000).return(
          this.publishKorea(type as NewsCategoryKorea),
        ),
      );
    }

    return jobs;
  }

  async publishResendAll() {
    return await this.publishDiscordService.resendNews();
  }

  async publishGlobal(type: NewsCategoryGlobal, locale: string) {
    // 제공 카테고리 양식
    const content: NewsCategoryContents = NewsCategories.Global[type];

    // 최신 소식을 가져오면서 Redis 에 넣음
    const fetchPosts = await this.archiveService.getGlobal(type, locale, true);
    const newPosts = await this.addId(fetchPosts, locale, type);

    // Redis 에 등록할 때 새로운 글이 없다면 그냥 끝냄
    if (newPosts.length === 0) return newPosts;

    // Webhook 등록된 서버들에게 메세지를 전송한다.
    await this.sendMessageWithMembers(
      newPosts,
      content,
      type.toString(),
      locale,
    );
  }

  async publishKorea(type: NewsCategoryKorea) {
    // 제공 카테고리 양식
    const pLocale = 'kr';
    const content: NewsCategoryContents = NewsCategories.Korea[type];

    // 최신 소식을 가져오면서 Redis 에 넣음
    const fetchPosts = await this.archiveService.getKorea(type, true);
    const newPosts = await this.addId(fetchPosts, pLocale, type);

    // Redis 에 등록할 때 새로운 글이 없다면 그냥 끝냄
    if (newPosts.length === 0) return newPosts;

    // Webhook 등록된 서버들에게 메세지를 전송한다.
    await this.sendMessageWithMembers(
      newPosts,
      content,
      type.toString(),
      pLocale,
    );
  }

  private async sendMessageWithMembers(
    posts: NewsContent[],
    categoryContents: NewsCategoryContents,
    typeStr: string,
    locale: string,
  ) {
    // 디스코드에 전달할 메세지를 생성한다.
    const newEmbedPosts = this.makeEmbedPostMessages(
      posts,
      categoryContents,
      locale,
    );

    // Redis 에서 모든 등록된 웹훅 주소를 불러온 후, Embed 는 10개씩 한 묶음으로, Webhook 은 20개씩 한 묶음으로 구성해서 전송한다.
    // 이때 Discord 웹훅 제한이 걸릴 수 있으므로 주의할 것
    const res: Array<string> = await this.cacheLoadPort.getNewsGuildWebhooks(
      typeStr,
      locale,
    );
    if (res) {
      await this.publishDiscordService.sendNews(
        res,
        newEmbedPosts,
        typeStr,
        locale,
      );
    }
  }

  private makeEmbedPostMessages(
    posts: NewsContent[],
    categoryContents: NewsCategoryContents,
    locale: string,
  ): EmbedBuilder[] {
    return posts.map((post) => {
      let link = `https://`;
      if ('kr' === locale)
        link = `${link}www.ff14.co.kr${categoryContents.link}`;
      else
        link = `${link}${locale}.finalfantasyxiv.com${categoryContents.link}`;

      return (
        new EmbedBuilder()
          .setColor(categoryContents.color)
          .setTitle(post.title)
          .setDescription(post.description || null) // TODO:: 글로벌 시간 설정
          // .setTimestamp(new Date())
          .setURL(post.url)
          .setImage(post.thumbnail)
          .setThumbnail(categoryContents.thumbnail)
          .setAuthor({
            name: categoryContents.name,
            iconURL: categoryContents.icon,
            url: link,
          })
          .setFooter({
            text: this.configService.get('APP_NAME'),
          })
      );
    });
  }

  /**
   * 게시글 id Cache 등록
   *
   * @param posts 데이터
   * @param locale 언어
   * @param typeStr 카테고리
   * @return 게시글 id
   */
  async addId(posts: NewsContent[], locale: string, typeStr: string) {
    if (!posts) {
      this.loggerService.error(`등록할 게시글이 존재하지 않습니다.`);
      return [];
    }

    const propSet: any = {};
    for (const d of posts) {
      propSet[d.idx] = await this.cacheSavePort.addNewsId(d, typeStr, locale);
    }

    const adds: Array<NewsContent> = [];
    await PromiseAdv.props(propSet).then((values: any) => {
      posts.forEach((d: NewsContent) => {
        if (values[d.idx]) adds.push(d);
      });
    });
    adds.sort((a: NewsContent, b: NewsContent) => {
      if (b.timestamp && a.timestamp) {
        return b.timestamp - a.timestamp;
      } else {
        return 0;
      }
    });
    return adds;
  }
}
