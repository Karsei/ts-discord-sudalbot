import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import NewsCategories, {
  LodestoneLocales,
} from '../../../definitions/interface/archive';
import { SaveWebhookDto } from '../../dto/save-webhook.dto';
import { Guild } from '../../../entities/guild.entity';

import axios from 'axios';
import {
  NewsPublishCacheLoadPort,
  NewsPublishCacheLoadPortToken,
} from '../../port/out/news-publish-cache-load-port.interface';
import {
  NewsPublishCacheSavePort,
  NewsPublishCacheSavePortToken,
} from '../../port/out/news-publish-cache-save-port.interface';
import {
  NewsPublishDbLoadPort,
  NewsPublishDbLoadPortToken,
} from '../../port/out/news-publish-db-load-port.interface';
import {
  NewsPublishDbSavePort,
  NewsPublishDbSavePortToken,
} from '../../port/out/news-publish-db-save-port.interface';

@Injectable()
export class WebhookService {
  constructor(
    @Inject(Logger)
    private readonly loggerService: LoggerService,
    private readonly configService: ConfigService,
    @Inject(NewsPublishCacheLoadPortToken)
    private readonly newsPublishCacheLoadPort: NewsPublishCacheLoadPort,
    @Inject(NewsPublishCacheSavePortToken)
    private readonly newsPublishCacheSavePort: NewsPublishCacheSavePort,
    @Inject(NewsPublishDbLoadPortToken)
    private readonly newsPublishDbLoadPort: NewsPublishDbLoadPort,
    @Inject(NewsPublishDbSavePortToken)
    private readonly newsPublishDbSavePort: NewsPublishDbSavePort,
  ) {}

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
    const data =
      `client_id=${this.configService.get(
        'REACT_APP_DISCORD_BOT_CLIENT_ID',
      )}&` +
      `client_secret=${this.configService.get('DISCORD_BOT_CLIENT_SECRET')}` +
      `&grant_type=authorization_code` +
      `&code=${code}` +
      // Dev Portal 에 명시되어 있음 - If you pass a URI in an OAuth request, it must exactly match one of the URIs you enter here.
      // 완전히 반드시 똑같아야 함
      `&redirect_uri=${this.configService.get(
        'REACT_APP_DISCORD_URL_BOT_HOST',
      )}${this.configService.get('DISCORD_URL_BOT_AUTHORIZE_URI')}`;

    const res = await axios({
      method: 'POST',
      url: `https://discord.com/api/oauth2/token`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: data,
    });

    return {
      url: `https://discord.com/api/webhooks/${res.data.webhook.id}/${res.data.webhook.token}`,
      hookData: res.data,
    };
  }

  /**
   * 서버 정보를 저장합니다.
   * @param webhookRes Webhook 저장 후 결과
   */
  private async saveGuild(webhookRes: { hookData: any; url: string }) {
    const guild = await this.newsPublishDbLoadPort.getGuild(
      webhookRes.hookData.guild.id,
    );
    const savedGuild = await this.newsPublishDbSavePort.saveGuild(
      !guild ? webhookRes.hookData.guild.id : guild.id,
      webhookRes.hookData.guild.name,
      webhookRes.hookData.webhook.id,
      webhookRes.hookData.webhook.token,
      webhookRes.hookData.webhook.url,
      webhookRes.hookData.webhook.channel_id,
    );

    // Cache 추가
    await this.newsPublishCacheSavePort.addGuildsAll(
      webhookRes.hookData.guild.id,
      webhookRes.hookData.webhook.url,
    );

    // Webhook 추가
    const existWebhook = await this.newsPublishCacheLoadPort.checkInAllWebhooks(
      webhookRes.hookData.webhook.url,
    );
    if (!existWebhook) {
      await this.newsPublishCacheSavePort.addUrlAll(
        webhookRes.hookData.webhook.url,
      );
      this.loggerService.log(
        `${webhookRes.hookData.guild.id} - ${webhookRes.hookData.webhook.url} 등록 완료`,
      );
    }

    return savedGuild;
  }

  /**
   * 기본 소식 유형을 저장합니다.
   * @param guild 서버
   */
  private saveDefaultNews(guild: Guild) {
    // 한국
    Object.keys(NewsCategories.Korea).map((type) => {
      this.addUrl(guild.id, 'kr', type, guild.webhookUrl);
    });
    // 글로벌
    Object.keys(NewsCategories.Global).map((type) => {
      LodestoneLocales.forEach((locale) => {
        // 당분간 북미 기준으로 topics, updates, developers 만 허용
        if (
          ['topics', 'updates', 'developers'].indexOf(type) > -1 &&
          ['na'].indexOf(locale) > -1
        ) {
          this.addUrl(guild.id, locale, type, guild.webhookUrl);
        }
      });
    });
  }

  /**
   * 게시글별 Webhook URL Cache 등록
   *
   * @param guildId 서버 IDX
   * @param locale 언어
   * @param type 카테고리
   * @param url Webhook URL
   */
  async addUrl(guildId: string, locale: string, type: string, url: string) {
    if (
      !(await this.newsPublishDbLoadPort.checkExistWebhookNews(
        locale,
        type,
        url,
      ))
    ) {
      await this.newsPublishDbSavePort.addWebhookNews(
        guildId,
        locale,
        type,
        url,
      );
    }
    return this.newsPublishCacheSavePort.addWebhookNews(
      guildId,
      locale,
      type,
      url,
    );
  }
}
