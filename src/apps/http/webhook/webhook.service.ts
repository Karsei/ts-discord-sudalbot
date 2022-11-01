import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';

import NewsCategories, { LodestoneLocales } from '../../../types/archive.constant';
import { SaveWebhookDto } from './dto/save-webhook.dto';

const axios = require('axios');

@Injectable()
export class WebhookService {
    private readonly redis: Redis;

    constructor(private readonly configService: ConfigService,
                private readonly redisService: RedisService) {
        this.redis = this.redisService.getClient();
    }

    /**
     * Discord Bot 을 인증하고 서버의 Webhook 을 저장합니다.
     * @param param 필요 파라미터
     */
    async subscribe(param: SaveWebhookDto) {
        // 인증 후 Webhook 생성
        const webhookRes = await this.makeWebhook(param.code);
        const webhookUrl = webhookRes.url;

        // 나라별 소식
        // 한국
        Object.keys(NewsCategories.Korea).map(type => {
            this.addUrl('kr', type, webhookUrl);
        });
        // 글로벌
        Object.keys(NewsCategories.Global).map(type => {
            LodestoneLocales.forEach(locale => {
                // 당분간 북미 기준으로 topics, updates, developers 만 허용
                if (['topics', 'updates', 'developers'].indexOf(type) > -1 && ['na'].indexOf(locale) > -1) {
                    this.addUrl(locale, type, webhookUrl);
                }
            });
        });
    }

    /**
     * Discord 인증 후 Webhook 주소를 생성합니다.
     * @param code Discord 에서 전달한 응답 코드
     */
    async makeWebhook(code: string) {
        // https://discord.com/developers/docs/resources/webhook#webhook-object
        const data = `client_id=${this.configService.get('DISCORD_BOT_CLIENT_ID')}&`
                    + `client_secret=${this.configService.get('DISCORD_BOT_CLIENT_SECRET')}`
                    + `&grant_type=authorization_code`
                    + `&code=${code}`
                    // Dev Portal 에 명시되어 있음 - If you pass a URI in an OAuth request, it must exactly match one of the URIs you enter here.
                    // 완전히 반드시 똑같아야 함
                    + `&redirect_uri=${this.configService.get('DISCORD_URL_BOT_HOST')}${this.configService.get('DISCORD_URL_BOT_AUTHORIZE_URI')}`;

        const res = await axios({
            method: 'POST',
            url: `https://discord.com/api/oauth2/token`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: data,
        });

        return { url: `https://discord.com/api/webhooks/${res.data.webhook.id}/${res.data.webhook.token}`, hookData: res.data };
    }

    /**
     * 게시글별 Webhook URL Cache 등록
     *
     * @param locale 언어
     * @param type 카테고리
     * @param url Webhook URL
     */
    async addUrl(locale: string, type: string, url: string) {
        return this.redis.sadd(`${locale}-${type}-webhooks`, url);
    }
}
