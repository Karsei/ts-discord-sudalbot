import { Injectable } from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {Submission} from 'snoowrap';
import {RedditError} from '../../../exceptions/reddit.exception';

@Injectable()
export class FashionCheckService {
    constructor(private readonly configService: ConfigService) {
    }

    getFashion(): Promise<Submission> {
        const reddit = new (require('snoowrap'))({
            userAgent: this.configService.get('APP_NAME'),
            clientId: this.configService.get('REDDIT_CLIENT_ID'),
            clientSecret: this.configService.get('REDDIT_CLIENT_SECRET'),
            refreshToken: this.configService.get('REDDIT_CLIENT_REFRESH_TOKEN'),
        });

        return new Promise((resolve, reject) => {
            reddit.getSubreddit('ffxiv')
                .search({
                    query: 'author:kaiyoko Fashion Report',
                    sort: 'new'
                })
                .then(value => {
                    if (!value || value.length <= 0) throw new RedditError('패션체크 최신 정보를 발견할 수 없습니다.');
                    resolve(value.at(0));
                })
                .catch(err => {
                    reject(err);
                })
        });
    }
}
