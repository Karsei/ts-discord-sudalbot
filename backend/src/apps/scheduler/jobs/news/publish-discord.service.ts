import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import { EmbedBuilder } from 'discord.js';

const axios = require('axios').default;
const PromiseAdv = require('bluebird');

@Injectable()
export class PublishDiscordService {
    private readonly redis: Redis;

    constructor(@Inject(Logger) private readonly loggerService: LoggerService,
                private readonly redisService: RedisService) {
        this.redis = this.redisService.getClient();
    }

    async sendNews(whiteList: Array<string>, post: EmbedBuilder[], type: string, locale: string) {
        let result = {
            success: 0,
            removed: 0,
            fail: 0,
            limited: 0,
        };

        let originNewPosts = post.length;
        let originWhLists = whiteList.length;
        while (post.length) {
            // 10개씩 게시글을 묶는다.
            let embedPosts = post.splice(0, 10);
            let posts = { embeds: embedPosts };

            while (whiteList.length) {
                // 20개씩 묶어서 Webhook 호출하면서 보낸다.
                let hookUrls = whiteList.splice(0, 20);

                let hookRes = await Promise.all(hookUrls.map((hookUrl: string) => this.deployNews(hookUrl, posts, type, locale)));
                hookRes.forEach(hr => {
                    switch (hr) {
                        case 'success':
                            result.success++;
                            break;
                        case 'removed':
                            result.removed++;
                            break;
                        case 'fail':
                            result.fail++;
                            break;
                        case 'limited':
                            result.limited++;
                            break;
                    }
                });
            }
        }

        let numUrls = originWhLists - result.removed;
        if (result.removed > 0)     this.loggerService.log(`${result.removed}개의 Webhook 이 제거되었습니다.`);
        if (result.fail > 0)        this.loggerService.log(`${result.fail}개의 Webhook 이 전송에 실패하였습니다.`);
        if (result.limited > 0)     this.loggerService.log(`${result.limited}개의 Webhook 이 전송하는데 제한되었습니다.`);
        this.loggerService.log(`총 ${originNewPosts}개의 ${type} ('${locale}') 게시글 - 총 ${numUrls}개의 Webhook 으로 전송하는데 ${result.success}개가 성공하였습니다.`);
    }

    /**
     * 게시글을 각 디스코드 서버에 배포합니다.
     * @param url Webhook URL
     * @param post 배포할 게시글
     * @param typeStr 카테고리
     * @param locale 언어
     * @private
     */
    async deployNews(url: string, post: {embeds: EmbedBuilder[]}, typeStr: string, locale: string) {
        try {
            const res = await axios({
                method: 'POST',
                url: url,
                headers: {
                    'Content-Type': 'application/json'
                },
                data: post,
            });

            // 너무 많이 보낸 경우 미리 딜레이를 줌
            await PublishDiscordService.delayIfManyRequests(res);

            return 'success';
        }
        catch (err) {
            if (!err) {
                this.loggerService.error('오류가 존재하지 않습니다. 다시 재시도합니다.');
                await this.addResendItem(url, post, locale, typeStr);
                return 'fail';
            }

            this.loggerService.error('소식을 디스코드 서버에 전송하는 과정에서 오류가 발생했습니다. 원인을 분석합니다...', err);

            // 정상 요청이 아님
            switch (err.response.status) {
                case 400:
                    return await this.onHandleBadRequest(err, locale, typeStr, url, post);
                // 요청을 너무 많이 보냄
                case 429:
                    return await this.onHandleTooManyRequest(err, url, post, locale, typeStr);
                // 웹 후크가 없음
                case 404:
                    return await this.onHandleNotFound(err, locale, typeStr, url, post);
                // 그 외
                default:
                    await this.addResendItem(url, post, locale, typeStr);
                    return 'fail';
            }
        }
    }

    private static async delayIfManyRequests(res) {
        if (res.headers['x-ratelimit-remaining'] == '0') {
            let time = (parseInt(res.headers['x-ratelimit-reset']) * 1000) - (new Date().getTime());
            if (time > 0) {
                await PromiseAdv.delay(time + 1000);
            }
        }
    }

    private async onHandleNotFound(err, locale: string, typeStr: string, url: string, post: { embeds: EmbedBuilder[] }) {
        if (err.response.data) {
            // Webhook 제거됨
            if (err.response.data.code === 10015) {
                this.loggerService.log(`존재하지 않는 Webhook 입니다. 삭제를 시도합니다...`);
                await this.delUrl(locale, typeStr, url);
                this.loggerService.log(`웹 후크가 삭제되었습니다. > ${locale}, ${typeStr} - ${url}`);
                return 'removed';
            } else {
                await this.addResendItem(url, post, locale, typeStr);
                return 'fail';
            }
        } else {
            this.loggerService.log('소식을 보내는 과정에서 알 수 없는 오류가 발생했습니다.');
            await this.addResendItem(url, post, locale, typeStr);
            return 'fail';
        }
    }

    private async onHandleTooManyRequest(err, url: string, post: { embeds: EmbedBuilder[] }, locale: string, typeStr: string) {
        this.loggerService.log(`과도한 요청으로 인해 다시 재전송을 시도합니다...`);
        await PromiseAdv.delay(err.response.data.retry_after);
        await this.addResendItem(url, post, locale, typeStr);
        return 'limited';
    }

    private async onHandleBadRequest(err, locale: string, typeStr: string, url: string, post: { embeds: EmbedBuilder[] }) {
        if (err.response.data) {
            // Webhook 제거됨
            if (err.response.data.code === 10015) {
                this.loggerService.log(`존재하지 않는 Webhook 입니다. 삭제를 시도합니다...`);
                await this.delUrl(locale, typeStr, url);
                this.loggerService.log(`웹 후크가 삭제되었습니다. > ${locale}, ${typeStr} - ${url}`);
                return 'removed';
            } else {
                await this.addResendItem(url, post, locale, typeStr);
                return 'fail';
            }
        } else {
            this.loggerService.error('something error occured');
            await this.addResendItem(url, post, locale, typeStr);
            return 'fail';
        }
    }

    /**
     * 소식 다시 보낼 객체 삽입
     *
     * @param url Webhook URL
     * @param post 데이터
     * @param locale 언어
     * @param type 카테고리
     */
    async addResendItem(url: string, post: {embeds: EmbedBuilder[]}, locale: string, type: string) {
        return this.redis.lpush('webhooks-news-resend', JSON.stringify({ url: url, body: post, locale: locale, type: type }));
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
}
