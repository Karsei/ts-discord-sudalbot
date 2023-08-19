import { RedisService } from '@liaoliaots/nestjs-redis';
import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Submission } from 'snoowrap';
import { RedditError } from '../../../../exceptions/reddit.exception';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { FashionCheckNotice } from '../../../../entities/fashioncheck-notice.entity';
import { FashionCheckError } from '../../../../exceptions/fashion-check.exception';
import { EmbedBuilder } from 'discord.js';

const axios = require('axios').default;
const PromiseAdv = require('bluebird');

interface ManagedWebhook {
  guildId: string;
  webhookId: string;
  webhookToken: string;
  channelId: string;
}

@Injectable()
export class FashionCheckService {
  private readonly reddit;
  private readonly redis: Redis;

  constructor(
    @Inject(Logger) private readonly loggerService: LoggerService,
    private readonly configService: ConfigService,
    @InjectRepository(FashionCheckNotice)
    private fashionCheckRepository: Repository<FashionCheckNotice>,
    private readonly redisService: RedisService,
  ) {
    this.reddit = new (require('snoowrap'))({
      userAgent: 'DalDalee Bot',
      clientId: this.configService.get('REDDIT_CLIENT_ID'),
      clientSecret: this.configService.get('REDDIT_CLIENT_SECRET'),
      refreshToken: this.configService.get('REDDIT_CLIENT_REFRESH_TOKEN'),
    });
    this.redis = this.redisService.getClient();
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

  async getWebhook(guildId: string): Promise<ManagedWebhook> {
    const cache = await this.redis.hget('fashion-check-notice', guildId);
    if (cache != null) return JSON.parse(cache);

    const db = await this.fashionCheckRepository.findOneBy({
      guild: { id: guildId },
    });
    if (db != null)
      return {
        guildId: guildId,
        channelId: db.webhookChannelId,
        webhookId: db.webhookId,
        webhookToken: db.webhookToken,
      };
    throw new FashionCheckError(
      '패션체크 소식 전달 대상 데이터를 찾을 수 없습니다.',
    );
  }

  async setWebhook(webhook: ManagedWebhook) {
    // DB
    await this.fashionCheckRepository.delete(webhook.guildId);
    await this.fashionCheckRepository.insert({
      guild: { id: webhook.guildId },
      webhookId: webhook.webhookId,
      webhookToken: webhook.webhookToken,
      webhookChannelId: webhook.channelId,
    });
    // Cache
    return this.redis.hset(
      'fashion-check-notice',
      webhook.guildId,
      JSON.stringify({
        guildId: webhook.guildId,
        webhookId: webhook.webhookId,
        webhookToken: webhook.webhookToken,
        channelId: webhook.channelId,
      }),
    );
  }

  async delWebhook(webhook: ManagedWebhook) {
    // DB
    await this.fashionCheckRepository.delete(webhook.guildId);
    await this.redis.hdel('fashion-check-notice', webhook.guildId);
  }

  async getWebhookGuildIdList() {
    let guildIds = await this.redis.hkeys('fashion-check-notice');
    if (guildIds == null || guildIds.length <= 0) {
      const guilds = await this.fashionCheckRepository.find({
        where: {
          deletedAt: IsNull(),
        },
      });
      if (guilds != null) {
        guildIds = [];
        for (const guildObj of guilds) {
          guildIds.push(guildObj.guild.id);
        }
      }
    }
    return guildIds;
  }

  async isExistTopic(topicId: string) {
    return this.redis.sismember('fashion-check-topic', topicId);
  }

  async saveTopic(topicId: string) {
    return this.redis.sadd('fashion-check-topic', topicId);
  }

  async publishAll() {
    // 새 소식 확인
    const submission = this.getFashion();
    submission.then(async (topic) => {
      const exist = await this.isExistTopic(topic.id);
      if (exist) return;

      // 없으면 저장하고 새롭게 보냄
      await this.saveTopic(topic.id);
      const topicMessage = this.makeTopicMessage(topic);
      const guildIds = await this.getWebhookGuildIdList();
      for (const guildId of guildIds) {
        const webhook = await this.getWebhook(guildId);
        await this.send(webhook, { embeds: [topicMessage] });
      }
    });
  }

  /**
   * 게시글을 각 디스코드 서버에 배포합니다.
   * @param webhook Webhook
   * @param post
   * @private
   */
  async send(webhook: ManagedWebhook, post: { embeds: EmbedBuilder[] }) {
    try {
      const res = await axios({
        method: 'POST',
        url: this.makeWebhookUrl(webhook),
        headers: {
          'Content-Type': 'application/json',
        },
        data: post,
      });

      // 너무 많이 보낸 경우 미리 딜레이를 줌
      await this.delayIfManyRequests(res);

      return 'success';
    } catch (err) {
      if (!err) {
        this.loggerService.error(
          '오류가 존재하지 않습니다. 다시 재시도합니다.',
        );
        await this.send(webhook, post);
        return 'fail';
      }

      this.loggerService.error(
        '소식을 디스코드 서버에 전송하는 과정에서 오류가 발생했습니다. 원인을 분석합니다...',
        err,
      );

      // 정상 요청이 아님
      switch (err.response.status) {
        case 400:
          return await this.onHandleBadRequest(err, webhook, post);
        // 요청을 너무 많이 보냄
        case 429:
          return await this.onHandleTooManyRequest(err, webhook, post);
        // 웹 후크가 없음
        case 404:
          return await this.onHandleNotFound(err, webhook, post);
        // 그 외
        default:
          await this.send(webhook, post);
          return 'fail';
      }
    }
  }

  private async delayIfManyRequests(res) {
    if (res.headers['x-ratelimit-remaining'] == '0') {
      const time =
        parseInt(res.headers['x-ratelimit-reset']) * 1000 -
        new Date().getTime();
      if (time > 0) {
        await PromiseAdv.delay(time + 1000);
      }
    }
  }

  private async onHandleNotFound(
    err,
    webhook: ManagedWebhook,
    post: { embeds: EmbedBuilder[] },
  ) {
    if (err.response.data) {
      // Webhook 제거됨
      if (err.response.data.code === 10015) {
        this.loggerService.log(
          `존재하지 않는 Webhook 입니다. DB 에서 삭제를 시도합니다...`,
        );
        await this.delWebhook(webhook);
        this.loggerService.log(
          `웹 후크가 삭제되었습니다. > 길드 ID: ${webhook.guildId}, 웹훅 ID: ${webhook.webhookId}, 웹훅 토큰: ${webhook.webhookToken}`,
        );
        return 'removed';
      } else {
        await this.send(webhook, post);
        return 'fail';
      }
    } else {
      this.loggerService.log(
        '소식을 보내는 과정에서 알 수 없는 오류가 발생했습니다.',
      );
      await this.send(webhook, post);
      return 'fail';
    }
  }

  private async onHandleTooManyRequest(
    err,
    webhook: ManagedWebhook,
    post: { embeds: EmbedBuilder[] },
  ) {
    this.loggerService.log(`과도한 요청으로 인해 다시 재전송을 시도합니다...`);
    await PromiseAdv.delay(err.response.data.retry_after);
    await this.send(webhook, post);
    return 'limited';
  }

  private async onHandleBadRequest(
    err,
    webhook: ManagedWebhook,
    post: { embeds: EmbedBuilder[] },
  ) {
    if (err.response.data) {
      // Webhook 제거됨
      if (err.response.data.code === 10015) {
        this.loggerService.log(
          `존재하지 않는 Webhook 입니다. 삭제를 시도합니다...`,
        );
        await this.delWebhook(webhook);
        this.loggerService.log(
          `웹 후크가 삭제되었습니다. > 길드 ID: ${webhook.guildId}, 웹훅 ID: ${webhook.webhookId}, 웹훅 토큰: ${webhook.webhookToken}`,
        );
        return 'removed';
      } else {
        await this.send(webhook, post);
        return 'fail';
      }
    } else {
      this.loggerService.error('something error occured');
      await this.send(webhook, post);
      return 'fail';
    }
  }

  /**
   * Embed 메시지 생성
   * @param fashionInfo Reddit 데이터 정보
   * @private
   */
  public makeTopicMessage(fashionInfo: Submission) {
    return new EmbedBuilder()
      .setColor('#fc03f4')
      .setTitle(`패션 체크`)
      .setDescription(
        `${fashionInfo.title}\n(Powered By. Kaiyoko Star)\n\n글로벌과 한국 서버의 패션 체크는 동일합니다.`,
      )
      .setTimestamp(new Date())
      .setFields({
        name: '한국어',
        value: `[Google 시트](https://docs.google.com/spreadsheets/d/1RvbOnwLVlAKq7GwXwc3tAjQFtxQyk9PqrHa1J3vVB-g/edit#gid=174904573)`,
      })
      .setURL(`https://www.reddit.com/${fashionInfo.permalink}`)
      .setImage(fashionInfo.url)
      .setThumbnail(
        'https://styles.redditmedia.com/t5_c3dzb/styles/profileIcon_ugxkdcpuxbp51.png?width=256&height=256&crop=256:256,smart&s=a1f754e55d562256c326bbc97302bc7d895e3806',
      )
      .setFooter({
        text: this.configService.get('APP_NAME'),
      });
  }

  private makeWebhookUrl(webhook: ManagedWebhook) {
    return `https://discord.com/api/webhooks/${webhook.webhookId}/${webhook.webhookToken}`;
  }
}
