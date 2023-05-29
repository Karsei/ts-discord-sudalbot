import { MessageEmbed } from "discord.js";
import NewsContent from "../definition/newsContent";

const Logger = require('../lib/logger');
const PromiseAdv = require('bluebird');

export default class RedisAdapter {
  private readonly redisCon: any;
  constructor(redisCon: any) {
    this.redisCon = redisCon;
  }

  getInstance() {
    return this.redisCon;
  }

  /**
   * 게시글별 Webhook URL Cache 등록
   *
   * @param pLocale 언어
   * @param pType 카테고리
   * @param pUrl Webhook URL
   */
  async addUrl(pLocale: string, pType: string, pUrl: string) {
    return this.redisCon.sAdd(`${pLocale}-${pType}-webhooks`, pUrl);
  }

  /**
   * 게시글별 Webhook URL Cache 삭제
   *
   * @param pLocale 언어
   * @param pType 카테고리
   * @param pUrl Webhook URL
   */
  async delUrl(pLocale: string, pType: string, pUrl: string) {
    return this.redisCon.sRem(`${pLocale}-${pType}-webhooks`, pUrl);
  }

  /**
   * 모든 서버 고유번호 목록에 등록
   *
   * @param pGuildId Discord 서버 고유번호
   * @param pUrl Webhook URL
   */
  async addGuildsAll(pGuildId: string, pUrl: string) {
    return this.redisCon.hSet('all-guilds', pGuildId, pUrl);
  }

  /**
   * 모든 서버 Webhook 목록에 등록
   *
   * @param pUrl Webhook URL
   */
  async addUrlAll(pUrl: string) {
    return this.redisCon.sAdd(`all-webhooks`, pUrl);
  }

  /**
   * 모든 서버 Webhook 목록에 해당 url이 있는지 확인
   *
   * @param pUrl Webhook URL
   */
  async checkInAllWebhooks(pUrl: string) {
    return this.redisCon.sIsMember(`all-webhooks`, pUrl);
  }

  /**
   * 특정 소식에 해당 Webhook URL이 있는지 확인
   *
   * @param pLocale 언어
   * @param pType 카테고리
   * @param pUrl Webhook URL
   */
  async checkInWebhook(pLocale: string, pType: string, pUrl: string) {
    return this.redisCon.sIsMember(`${pLocale}-${pType}-webhooks`, pUrl);
  }

  /**
   * 게시글 id Cache 등록
   *
   * @param pData 데이터
   * @param pLocale 언어
   * @param pTypeStr 카테고리
   * @return 게시글 id
   */
  async addId(pData: Array<NewsContent>, pLocale: string, pTypeStr: string) {
    if (!pData) {
      Logger.error(`등록할 게시글이 존재하지 않습니다.`);
      return [];
    }

    let propSet: any = {};
    pData.forEach(d => {
      propSet[d.idx] = this.redisCon.sAdd(`${pLocale}-${pTypeStr}-ids`, d.idx);
    });

    let adds: Array<NewsContent> = [];
    await PromiseAdv.props(propSet).then((values: any) => {
      pData.forEach((d: NewsContent) => {
        if (values[d.idx]) adds.push(d);
      });
    });
    adds.sort((a: NewsContent, b: NewsContent) => {
      if (b.timestamp && a.timestamp) {
        return b.timestamp - a.timestamp;
      }
      else {
        return 0;
      }
    });
    return adds;
  }

  /**
   * 소식 다시 보낼 Webhook URL과 데이터가 있는 객체 꺼냄
   *
   * @return url, body가 있는 객체
   */
  async popResendItem() {
    return this.redisCon.lPop('webhooks-news-resend');
  }

  /**
   * 소식 다시 보낼 Webhook URL과 데이터가 있는 객체의 개수 조회
   */
  async getResendItemLength() {
    return this.redisCon.lLen('webhooks-news-resend');
  }

  /**
   * 소식 다시 보낼 객체 삽입
   *
   * @param pUrl Webhook URL
   * @param pBody 데이터
   * @param pLocale 언어
   * @param pType 카테고리
   */
  async addResendItem(pUrl: string, pBody: {embeds: MessageEmbed[]}, pLocale: string, pType: string) {
    return this.redisCon.lPush('webhooks-news-resend', JSON.stringify({ url: pUrl, body: pBody, locale: pLocale, type: pType }));
  }

  /**
   * 서버 고유번호로 Webhook URL 조회
   *
   * @param pGuildId 서버 고유 번호
   * @return Webhook URL
   */
  async getHookUrlByGuildId(pGuildId: string) {
    return this.redisCon.hGet('all-guilds', pGuildId);
  }

  /**
   * 소식 Cache 설정
   * @param pNews 데이터
   * @param pType 타입
   * @param pLocale 언어
   */
  async setCache(pNews: string, pType: string, pLocale: string): Promise<void> {
    this.redisCon.hSet(`${pLocale}-news-data`, pType, pNews);
    this.redisCon.hSet(`${pLocale}-news-timestamp`, pType, new Date().getTime());
  }

  /**
   * 소식 Cache 조회
   * @param pType 타입
   * @param pLocale 언어
   */
  async getCache(pType: string, pLocale: string): Promise<string> {
    return await this.redisCon.hGet(`${pLocale}-news-data`, pType);
  }

  /**
   * 소식 갱신 시간이 지났는지 확인
   * @param pType 타입
   * @param pLocale 언어
   */
  async isOutDate(pType: string, pLocale: string): Promise<boolean> {
    let timestamp = await this.redisCon.hGet(`${pLocale}-news-timestamp`, pType);
    let cacheTime = timestamp ? timestamp : new Date(0).getTime();
    return new Date().getTime() > (parseInt(cacheTime) + 600);
  }
}