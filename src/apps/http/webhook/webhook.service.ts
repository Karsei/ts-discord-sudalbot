import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisService } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import { Repository } from 'typeorm';

import NewsCategories, { LodestoneLocales } from '../../../types/archive.constant';
import { YesNoFlag } from '../../../enums/common.enum';
import { SaveWebhookDto } from './dto/save-webhook.dto';
import { Guild } from '../../../entities/guild.entity';
import { News } from '../../../entities/news.entity';

const axios = require('axios');

@Injectable()
export class WebhookService {
    private readonly redis: Redis;

    constructor(private readonly configService: ConfigService,
                private readonly redisService: RedisService,
                @InjectRepository(Guild) private guildRepository: Repository<Guild>,
                @InjectRepository(News) private newsRepository: Repository<News>) {
        this.redis = this.redisService.getClient();
    }

    /**
     * Discord Bot 을 인증하고 서버의 Webhook 을 저장합니다.
     * @param param 필요 파라미터
     */
    async subscribe(param: SaveWebhookDto) {
        // 인증 후 Webhook 생성
        const webhookRes = await this.makeWebhook(param.code);

        // DB 에 저장
        const guild = await this.saveGuild(webhookRes);

        // 나라별 소식
        this.saveDefaultNews(guild);
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
     * 서버 정보를 저장합니다.
     * @param webhookRes Webhook 저장 후 결과
     */
    private async saveGuild(webhookRes: { hookData: any; url: string }) {
        let guild = await this.getGuild(webhookRes.hookData.guild.id);
        if (!guild) {
            guild.guildId = webhookRes.hookData.guild.id;
        }
        guild.name = webhookRes.hookData.guild.name;
        guild.webhookId = webhookRes.hookData.webhook.id;
        guild.webhookToken = webhookRes.hookData.webhook.token;
        guild.webhookUrl = webhookRes.hookData.webhook.url;
        guild.webhookChannelId = webhookRes.hookData.webhook.channel_id;
        return await this.guildRepository.save(guild);
    }

    /**
     * 서버 정보를 조회합니다.
     * @param guildId 서버 ID
     */
    private async getGuild(guildId: string) {
        return await this.guildRepository.findOneBy({ guildId: guildId });
    }

    /**
     * 기본 소식 유형을 저장합니다.
     * @param guild 서버
     */
    private saveDefaultNews(guild: Guild) {
        // 한국
        Object.keys(NewsCategories.Korea).map(type => {
            this.addUrl(guild.guildId, 'kr', type, guild.webhookUrl);
        });
        // 글로벌
        Object.keys(NewsCategories.Global).map(type => {
            LodestoneLocales.forEach(locale => {
                // 당분간 북미 기준으로 topics, updates, developers 만 허용
                if (['topics', 'updates', 'developers'].indexOf(type) > -1 && ['na'].indexOf(locale) > -1) {
                    this.addUrl(guild.guildId, locale, type, guild.webhookUrl);
                }
            });
        });
    }

    /**
     * 게시글별 Webhook URL Cache 등록
     *
     * @param guildId 서버 ID
     * @param locale 언어
     * @param type 카테고리
     * @param url Webhook URL
     */
    async addUrl(guildId: string, locale: string, type: string, url: string) {
        if (!await this.checkExistWebhookNews(locale, type, url)) {
            const news = new News();
            news.guildId = guildId;
            news.locale = locale;
            news.type = type;
            news.url = url;
            await this.newsRepository.save(news);
        }
        return this.redis.sadd(`${locale}-${type}-webhooks`, url);
    }

    /**
     * 소식을 현재 구독중인지 확인
     * @param locale 언어
     * @param type 카테고리
     * @param url Webhook URL
     */
    private async checkExistWebhookNews(locale: string, type: string, url: string) {
        const news = await this.newsRepository.findBy({ locale: locale, type: type, url: url, delFlag: YesNoFlag.NO });
        return news && news.length > 0;
    }
}