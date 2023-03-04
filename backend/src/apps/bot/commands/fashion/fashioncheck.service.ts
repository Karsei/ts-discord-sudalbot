import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Submission } from 'snoowrap';
import { RedditError } from '../../../../exceptions/reddit.exception';

@Injectable()
export class FashionCheckService {
  private readonly reddit;

  constructor(private readonly configService: ConfigService) {
    this.reddit = new (require('snoowrap'))({
      userAgent: 'DalDalee Bot',
      clientId: this.configService.get('REDDIT_CLIENT_ID'),
      clientSecret: this.configService.get('REDDIT_CLIENT_SECRET'),
      refreshToken: this.configService.get('REDDIT_CLIENT_REFRESH_TOKEN'),
    });
  }

  /**
   * 패션체크 정보 조회
   */
  getFashion(): Promise<Submission> {
    return new Promise((resolve, reject) => {
      this.reddit
        .getSubreddit('ffxiv')
        .search({
          query: 'author:kaiyoko Fashion Report',
          sort: 'new',
        })
        .then((value) => {
          if (!value || value.length <= 0)
            throw new RedditError('패션체크 최신 정보를 발견할 수 없습니다.');
          resolve(value.at(0));
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}
