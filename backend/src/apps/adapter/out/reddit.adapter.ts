import * as Snoowrap from 'snoowrap';
import { Submission } from 'snoowrap';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { FashionCheckRedditLoadPort } from '../../port/out/fashioncheck-reddit-load-port.interface';
import { RedditError } from '../../../exceptions/reddit.exception';

// https://github.com/not-an-aardvark/snoowrap/issues/221
declare module 'snoowrap' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  class RedditContent<T> {
    then: undefined;
    catch: undefined;
    finally: undefined;
  }
}

@Injectable()
export class RedditAdapter implements FashionCheckRedditLoadPort {
  private readonly reddit;

  constructor(private readonly configService: ConfigService) {
    this.reddit = new Snoowrap({
      userAgent: 'DalDalee Bot',
      clientId: this.configService.get('REDDIT_CLIENT_ID'),
      clientSecret: this.configService.get('REDDIT_CLIENT_SECRET'),
      refreshToken: this.configService.get('REDDIT_CLIENT_REFRESH_TOKEN'),
    });
  }

  async loadFashion(): Promise<Submission> {
    const results = await this.reddit.getSubreddit('ffxiv').search({
      query: 'author:kaiyoko Fashion Report - Full Details',
      sort: 'new',
    });

    if (!results || results.length <= 0)
      throw new RedditError('패션체크 최신 정보를 발견할 수 없습니다.');

    return results.at(0);
  }
}
