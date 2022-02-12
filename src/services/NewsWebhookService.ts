import axios from 'axios';
import {MessageEmbed} from 'discord.js';
const PromiseAdv = require('bluebird');
import RedisConnection from '../libs/redis';
const Logger = require('../libs/logger');
// Service
import NewsArchiveService from "./NewsArchiveService";
// Config
import NewsContent from '../shared/newsContent';
import NewsCategories, {NewsCategoryContents, NewsCategoryGlobal, NewsCategoryKorea} from '../shared/newsCategories';
import LodestoneLocales from '../shared/lodestoneLocales';
import BotAuthParams from '../shared/botAuthParams';
import Setting from '../shared/setting';

/**
 * 소식 웹훅 서비스
 */
export default class NewsWebhookService
{
    private static redisCon: any = RedisConnection.instance();

    /**
     * 서버에 Webhook 을 생성합니다.
     * @param pParams 필요 파라미터
     */
    static async subscribe(pParams: BotAuthParams) {
        const guildId = pParams.guild_id;
        const code = pParams.code;

        // Webhook 주소 생성
        const redirectUrl = `${Setting.DISCORD_URL_BOT_HOST}/authorize`;
        const hookUrlRes: { url: string; hookData: object } = await NewsWebhookService.makeWebhookUrl(code, redirectUrl);
        const hookUrl: string = hookUrlRes.url;

        // 나라별 소식
        // 한국
        Object.keys(NewsCategories.Korea).map(type => {
            WebhookCache.addUrl('kr', type, hookUrl);
        });
        // 글로벌
        Object.keys(NewsCategories.Global).map(type => {
            LodestoneLocales.forEach(locale => {
                // 당분간 북미 기준으로 topics, updates, developers 만 허용
                if (['topics', 'updates', 'developers'].indexOf(type) > -1 && ['na'].indexOf(locale) > -1) {
                    WebhookCache.addUrl(locale, type, hookUrl);
                }
            });
        });

        // Redis 에 서버별로 Webhook 주소 등록 (기본 등록)
        await WebhookCache.addGuildsAll(guildId, hookUrl);

        // Webhook 추가
        let existWebhook = await WebhookCache.checkInAllWebhooks(hookUrl);
        if (!existWebhook) {
            await WebhookCache.addUrlAll(hookUrl);
            Logger.info(`${guildId} - ${hookUrl} 등록 완료`);
        }
    }

    /**
     * Webhook 을 인증하고 주소를 생성합니다.
     *
     * @param {string} pCode 응답 코드
     * @param {string} pRedirectUrl Redirect URL
     */
    private static async makeWebhookUrl(pCode: string, pRedirectUrl: string): Promise<{ url: string, hookData: object }> {
        // https://discord.com/developers/docs/resources/webhook#webhook-object
        const makeData = `client_id=${Setting.DISCORD_BOT_CLIENT_ID}&client_secret=${Setting.DISCORD_BOT_CLIENT_SECRET}&grant_type=authorization_code&code=${pCode}&redirect_uri=${pRedirectUrl}`
        const res: any = await axios({
            method: 'POST',
            url: Setting.DISCORD_URL_OAUTH_TOKEN,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: makeData,
        });

        return { url: `${Setting.DISCORD_URL_WEBHOOK}/${res.data.webhook.id}/${res.data.webhook.token}`, hookData: res.data };
    }

    static async publishAll() {
        let jobs = [];

        // 글로벌
        let globalTypes = Object.keys(NewsCategories.Global);
        for (const locale of LodestoneLocales) {
            for (let idx in globalTypes) {
                let type = globalTypes[idx];
                jobs.push(await PromiseAdv.delay(1000).return(this.publishGlobal(type as NewsCategoryGlobal, locale)));
            }
        }
        // 한국
        let koreaTypes = Object.keys(NewsCategories.Korea);
        for (let idx in koreaTypes) {
            let type = koreaTypes[idx];
            jobs.push(await PromiseAdv.delay(1000).return(this.publishKorea(type as NewsCategoryKorea)));
        }

        return jobs;
    }

    static async publishGlobal(pType: NewsCategoryGlobal, pLocale: string) {
        // 제공 카테고리 양식
        const content: NewsCategoryContents = NewsCategories.Global[pType];

        // 최신 소식을 가져오면서 Redis에 넣음
        const fetchPosts = await NewsArchiveService.fetchGlobal(pType, pLocale, true);
        const newPosts = await WebhookCache.addId(fetchPosts, pLocale, pType);

        // Redis에 등록할 때 새로운 글이 없다면 그냥 끝냄
        if (newPosts.length === 0) return newPosts;

        // Webhook 등록된 서버들에게 메세지를 전송한다.
        await this.sendMessageWithMembers(newPosts, content, pType.toString(), pLocale);
    }

    static async publishKorea(pType: NewsCategoryKorea) {
        // 제공 카테고리 양식
        const pLocale = 'kr';
        const content: NewsCategoryContents = NewsCategories.Korea[pType];

        // 최신 소식을 가져오면서 Redis에 넣음
        const fetchPosts = await NewsArchiveService.fetchKorea(pType, true);
        const newPosts = await WebhookCache.addId(fetchPosts, pLocale, pType);

        // Redis에 등록할 때 새로운 글이 없다면 그냥 끝냄
        if (newPosts.length === 0) return newPosts;

        // Webhook 등록된 서버들에게 메세지를 전송한다.
        await this.sendMessageWithMembers(newPosts, content, pType.toString(), pLocale);
    }

    private static async sendMessageWithMembers(pNewsPosts: NewsContent[], pCategoryInfo: NewsCategoryContents, pTypeStr: string, pLocale: string) {
        // 디스코드에 전달할 메세지를 생성한다.
        const newEmbedPosts = this.makeEmbedPostMessages(pNewsPosts, pCategoryInfo, pLocale);

        // Redis에서 모든 등록된 웹훅 주소를 불러온 후, Embed는 10개씩 한 묶음으로, Webhook은 20개씩 한 묶음으로 구성해서 전송한다.
        // 이때 Discord 웹훅 제한이 걸릴 수 있으므로 주의할 것
        const res: Array<string> = await this.redisCon.sMembers(`${pLocale}-${pTypeStr}-webhooks`);
        if (res) {
            await this.sendMessage(res, newEmbedPosts, pTypeStr, pLocale);
        }
    }

    private static makeEmbedPostMessages(pPosts: NewsContent[], pCategoryContent: NewsCategoryContents, pLocale: string): Array<MessageEmbed> {
        return pPosts.map(post => {
            let link = `${Setting.BASE_URL_PROTOCOL}://`;
            if ('kr' === pLocale) link = `${link}${Setting.BASE_URL_KOREA}${pCategoryContent.link}`;
            else link = `${link}${pLocale}.${Setting.BASE_URL_LODESTONE}${pCategoryContent.link}`;

            return new MessageEmbed()
                .setColor(pCategoryContent.color)
                .setTitle(post.title)
                .setDescription(post.description || '') // TODO:: 글로벌 시간 설정
                // .setTimestamp(new Date())
                .setURL(post.url)
                .setImage(post.thumbnail || '')
                .setThumbnail(pCategoryContent.thumbnail || '')
                .setAuthor({
                    name: pCategoryContent.name,
                    iconURL: pCategoryContent.icon,
                    url: link
                })
                .setFooter({
                    text: Setting.APP_NAME,
                });
        });
    }

    private static async sendMessage(pWhiteList: Array<string>, pNewEmbedPosts: Array<MessageEmbed>, pTypeStr: string, pLocale: string) {
        let result = {
            success: 0,
            removed: 0,
            fail: 0,
            limited: 0,
        };

        let originNewPosts = pNewEmbedPosts.length;
        let originWhLists = pWhiteList.length;
        while (pNewEmbedPosts.length) {
            // 10개 묶음된 게시글
            let embedPosts = pNewEmbedPosts.splice(0, 10);
            let posts = { embeds: embedPosts };

            while (pWhiteList.length) {
                // 20개 묶음된 Webhook
                let hookUrls = pWhiteList.splice(0, 20);

                let hookRes = await Promise.all(hookUrls.map((hookUrl: string) => this.sendNews(hookUrl, posts, pTypeStr, pLocale)));
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
        if (result.removed > 0)     Logger.info(`${result.removed}개의 Webhook 이 제거되었습니다.`);
        if (result.fail > 0)        Logger.info(`${result.fail}개의 Webhook 이 전송에 실패하였습니다.`);
        if (result.limited > 0)     Logger.info(`${result.limited}개의 Webhook 이 전송하는데 제한되었습니다.`);
        Logger.info(`총 ${originNewPosts}개의 ${pTypeStr} ('${pLocale}') 게시글 - 총 ${numUrls}개의 Webhook 으로 전송하는데 ${result.success}개가 성공하였습니다.`);
    }

    /**
     * 게시글을 각 디스코드 서버에 배포합니다.
     * @param pHookUrl Webhook URL
     * @param pPost 배포할 게시글
     * @param pTypeStr 카테고리
     * @param pLocale 언어
     * @private
     */
    private static async sendNews(pHookUrl: string, pPost: {embeds: MessageEmbed[]}, pTypeStr: string, pLocale: string) {
        return new Promise(async (resolve, reject) => {
            await axios({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: pHookUrl,
                data: pPost,
            })
                .then(async res => {
                    // 너무 많이 보낸 경우 미리 딜레이를 줌
                    if (res.headers['x-ratelimit-remaining'] == '0') {
                        let time = (parseInt(res.headers['x-ratelimit-reset']) * 1000) - (new Date().getTime());
                        if (time > 0) {
                            await PromiseAdv.delay(time + 1000);
                        }
                    }
                    resolve('success');
                }).catch(async err => {
                    if (!err) {
                        Logger.error('오류가 존재하지 않습니다. 다시 재시도합니다.');
                        await WebhookCache.addResendItem(pHookUrl, pPost, pLocale, pTypeStr);
                        resolve('fail');
                    } else {
                        Logger.error('소식을 디스코드 서버에 전송하는 과정에서 오류가 발생했습니다. 원인을 분석합니다...', err);

                        // 정상 요청이 아님
                        if (err.response.status === 400) {
                            if (err.response.data) {
                                // Webhook 제거됨
                                if (err.response.data.code === 10015) {
                                    await WebhookCache.delUrl(pLocale, pTypeStr, pHookUrl);
                                    Logger.info(`웹 후크가 삭제되었습니다. > ${pLocale}, ${pTypeStr} - ${pHookUrl}`);
                                    resolve('removed');
                                } else {
                                    await WebhookCache.addResendItem(pHookUrl, pPost, pLocale, pTypeStr);
                                    resolve('fail');
                                }
                            } else {
                                Logger.error('something error occured');
                                await WebhookCache.addResendItem(pHookUrl, pPost, pLocale, pTypeStr);
                                resolve('fail');
                            }
                            // 요청을 너무 많이 보냄
                        } else if (err.response.status === 429) {
                            await PromiseAdv.delay(err.response.data.retry_after);
                            await WebhookCache.addResendItem(pHookUrl, pPost, pLocale, pTypeStr);
                            resolve('limited');
                            // 웹 후크가 없음
                        } else if (err.response.status === 404) {
                            if (err.response.data) {
                                // Webhook 제거됨
                                if (err.response.data.code === 10015) {
                                    await WebhookCache.delUrl(pLocale, pTypeStr, pHookUrl);
                                    Logger.info(`웹 후크가 삭제되었습니다. > ${pLocale}, ${pTypeStr} - ${pHookUrl}`);
                                    resolve('removed');
                                } else {
                                    await WebhookCache.addResendItem(pHookUrl, pPost, pLocale, pTypeStr);
                                    resolve('fail');
                                }
                            } else {
                                Logger.error('소식을 보내는 과정에서 알 수 없는 오류가 발생했습니다.');
                                await WebhookCache.addResendItem(pHookUrl, pPost, pLocale, pTypeStr);
                                resolve('fail');
                            }
                            // 그 외
                        } else {
                            await WebhookCache.addResendItem(pHookUrl, pPost, pLocale, pTypeStr);
                            resolve('fail');
                        }
                    }
                });
        });
    }

    /**
     * 실패한 게시글을 다시 각 디스코드 서버에 배포합니다.
     */
    static async publishResendAll() {
        let count = await WebhookCache.getResendItemLength();
        if (count == 0) return;

        Logger.info(`총 ${count}개의 게시글을 다시 전송합니다...`);
        let allCount = count;
        let success = 0;

        while (count > 0) {
            let cachedData = await WebhookCache.popResendItem();
            if (cachedData) {
                cachedData = JSON.parse(cachedData);

                try {
                    let resendRes = await axios({
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        url: cachedData.url,
                        data: cachedData.body,
                    });

                    // 너무 많이 보낸 경우 미리 딜레이를 줌
                    if (resendRes.headers['x-ratelimit-remaining'] == '0') {
                        let time = (parseInt(resendRes.headers['x-ratelimit-reset']) * 1000) - (new Date().getTime());
                        if (time > 0) {
                            await PromiseAdv.delay(time + 1000);
                        }
                    }

                    success++;
                } catch (err) {
                    Logger.error('최종적으로 재전송이 실패하였습니다.', err);
                }
            }

            // 다시 남아있는 개수 계산
            count = await WebhookCache.getResendItemLength();
        }

        Logger.info(`총 ${allCount}개의 게시글 중에서 ${success}개가 재전송을 하는데 성공하였습니다.`);
    }
}

export class WebhookCache
{
    private static redisCon: any = RedisConnection.instance();

    /**
     * 게시글별 Webhook URL Cache 등록
     *
     * @param pLocale 언어
     * @param pType 카테고리
     * @param pUrl Webhook URL
     */
    static async addUrl(pLocale: string, pType: string, pUrl: string) {
        return this.redisCon.sAdd(`${pLocale}-${pType}-webhooks`, pUrl);
    }

    /**
     * 게시글별 Webhook URL Cache 삭제
     *
     * @param pLocale 언어
     * @param pType 카테고리
     * @param pUrl Webhook URL
     */
    static async delUrl(pLocale: string, pType: string, pUrl: string) {
        return this.redisCon.sRem(`${pLocale}-${pType}-webhooks`, pUrl);
    }

    /**
     * 모든 서버 고유번호 목록에 등록
     *
     * @param pGuildId Discord 서버 고유번호
     * @param pUrl Webhook URL
     */
    static async addGuildsAll(pGuildId: string, pUrl: string) {
        return this.redisCon.hSet('all-guilds', pGuildId, pUrl);
    }

    /**
     * 모든 서버 Webhook 목록에 등록
     *
     * @param pUrl Webhook URL
     */
    static async addUrlAll(pUrl: string) {
        return this.redisCon.sAdd(`all-webhooks`, pUrl);
    }

    /**
     * 모든 서버 Webhook 목록에 해당 url이 있는지 확인
     *
     * @param pUrl Webhook URL
     */
    static async checkInAllWebhooks(pUrl: string) {
        return this.redisCon.sIsMember(`all-webhooks`, pUrl);
    }

    /**
     * 특정 소식에 해당 Webhook URL이 있는지 확인
     *
     * @param pLocale 언어
     * @param pType 카테고리
     * @param pUrl Webhook URL
     */
    static async checkInWebhook(pLocale: string, pType: string, pUrl: string) {
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
    static async addId(pData: Array<NewsContent>, pLocale: string, pTypeStr: string) {
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
    static async popResendItem() {
        return this.redisCon.lPop('webhooks-news-resend');
    }

    /**
     * 소식 다시 보낼 Webhook URL과 데이터가 있는 객체의 개수 조회
     */
    static async getResendItemLength() {
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
    static async addResendItem(pUrl: string, pBody: {embeds: MessageEmbed[]}, pLocale: string, pType: string) {
        return this.redisCon.lPush('webhooks-news-resend', JSON.stringify({ url: pUrl, body: pBody, locale: pLocale, type: pType }));
    }

    /**
     * 서버 고유번호로 Webhook URL 조회
     *
     * @param pGuildId 서버 고유 번호
     * @return Webhook URL
     */
    static async getHookUrlByGuildId(pGuildId: string) {
        return this.redisCon.hGet('all-guilds', pGuildId);
    }
}