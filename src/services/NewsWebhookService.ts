import axios from 'axios';
import {MessageEmbed} from 'discord.js';
const PromiseAdv = require('bluebird');
import Logger from 'jet-logger';
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
    private redisCon: any;
    private newsArchiveService: NewsArchiveService;
    private webHookCache: WebhookCache;
    constructor(redisCon: any) {
        this.redisCon = redisCon;
        this.newsArchiveService = new NewsArchiveService(redisCon);
        this.webHookCache = new WebhookCache(redisCon);
    }

    /**
     * 서버에 Webhook 을 생성합니다.
     * @param pCode 응답 코드
     * @param pParams 기타 필요 파라미터
     */
    async subscribe(pCode: number, pParams: BotAuthParams) {
        let guildId = pParams.guild_id;

        // Webhook 주소 생성
        const redirectUrl = `${Setting.DISCORD_URL_BOT_HOST}/authorize`;
        const hookUrlRes: any = this.makeWebhookUrl(pCode, redirectUrl);
        const hookUrl: string = hookUrlRes.url;

        // 나라별 소식
        // 한국
        Object.keys(NewsCategories.Korea).map(type => {
            this.webHookCache.addUrl('kr', type, hookUrl);
        });
        // 글로벌
        Object.keys(NewsCategories.Global).map(type => {
            LodestoneLocales.forEach(locale => {
                // 당분간 북미 기준으로 topics, updates, developers 만 허용
                if (['topics', 'updates', 'developers'].indexOf(type) > -1 && ['na'].indexOf(locale) > -1) {
                    this.webHookCache.addUrl(locale, type, hookUrl);
                }
            });
        });

        // Redis 에 서버별로 Webhook 주소 등록 (기본 등록)
        await this.webHookCache.addGuildsAll(guildId, hookUrl);

        // Webhook 추가
        let existWebhook = this.webHookCache.checkInAllWebhooks(hookUrl);
        if (!existWebhook) {
            await this.webHookCache.addUrlAll(hookUrl);
            Logger.info(`${guildId} - ${hookUrl} 등록 완료`);
        }
    }

    /**
     * Webhook 을 인증하고 주소를 생성합니다.
     *
     * @param {string} pCode 응답 코드
     * @param {string} pRedirectUrl Redirect URL
     */
    private async makeWebhookUrl(pCode: number, pRedirectUrl: string) {
        // https://discord.com/developers/docs/resources/webhook#webhook-object
        const makeData = `client_id=${Setting.DISCORD_BOT_CLIENT_ID}&client_secret=${Setting.DISCORD_BOT_CLIENT_SECRET}&grant_type=authorization_code&code=${pCode}&redirect_uri=${pRedirectUrl}`
        const res: any = await axios({
            method: 'POST',
            url: Setting.DISCORD_URL_OAUTH_TOKEN,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: makeData,
        }).catch(err => Logger.err(err));

        return { url: `${Setting.DISCORD_URL_WEBHOOK}/${res.data.webhook.id}/${res.data.webhook.token}`, hookData: res.data };
    }

    async executePublish(pType: NewsCategoryGlobal|NewsCategoryKorea, pCategory: NewsCategoryContents, pLocale: string) {
        // 최신 소식을 가져오면서 Redis에 넣음
        let newPosts = pLocale !== 'kr' ? await this.newsArchiveService.fetchGlobal(pType as NewsCategoryGlobal, pLocale, true) : await this.newsArchiveService.fetchKorea(pType as NewsCategoryKorea, true);
        newPosts = await this.webHookCache.addId(newPosts, pLocale, pType);
        // Redis에 등록할 때 새로운 글이 없다면 그냥 끝냄
        if (newPosts.length === 0) return newPosts;

        // 소식을 Embed 메세지로 만듦
        let newEmbedPosts = newPosts.map(post => {
            let link = `${Setting.BASE_URL_PROTOCOL}://`;
            if ('kr' === pLocale)   link = `${link}${Setting.BASE_URL_KOREA}${pCategory.link}`;
            else                    link = `${link}${pLocale}.${Setting.BASE_URL_LODESTONE}${pCategory.link}`;

            return new MessageEmbed()
                .setColor(pCategory.color)
                .setTitle(post.title)
                .setDescription(post.description as string) // TODO:: 글로벌 시간 설정
                // .setTimestamp(new Date())
                .setURL(post.url)
                .setImage(post.thumbnail as string)
                .setThumbnail(pCategory.thumbnail as string)
                .setAuthor({
                    name: pCategory.name,
                    iconURL: pCategory.icon,
                    url: link
                })
                .setFooter({
                    text: Setting.APP_NAME,
                });
        });

        // Redis에서 모든 등록된 웹훅 주소를 불러온 후, Embed는 10개씩 한 묶음으로, Webhook은 20개씩 한 묶음으로 구성해서 전송한다.
        // 이때 Discord 웹훅 제한이 걸릴 수 있으므로 주의할 것
        this.redisCon.smembers(`${pLocale}-${pType}-webhooks`, async (err: any, reply: any) => {
            if (err) throw err;
            let whList = reply;

            let result = {
                success: 0,
                removed: 0,
                fail: 0,
                limited: 0,
            };

            let originNewPosts = newEmbedPosts.length;
            let originWhLists = whList.length;
            while (newEmbedPosts.length) {
                // 10개 묶음된 게시글
                let embedPosts = newEmbedPosts.splice(0, 10);
                let posts = { embeds: embedPosts };

                while (whList.length) {
                    // 20개 묶음된 Webhook
                    let hookUrls = whList.splice(0, 20);

                    let hookRes = await Promise.all(hookUrls.map((hookUrl: string) => this.sendNews(hookUrl, posts, pLocale, pType)));
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
            if (result.removed > 0)     Logger.info(`${result.removed}개의 Webhook이 제거되었음`);
            if (result.fail > 0)        Logger.info(`${result.fail}개의 Webhook이 전송하는데 실패하였음`);
            if (result.limited > 0)     Logger.info(`${result.limited}개의 Webhook이 전송하는데 제한 걸림`);
            Logger.info(`총 ${originNewPosts}개의 ${pType} ('${pLocale}') 게시글을 총 ${numUrls}개의 Webhook 중에서 ${result.success}개가 전송하는데 성공함`);
        });
    }

    async executePublishAll() {
        let jobs = [];

        // 글로벌
        let globalTypes = Object.keys(NewsCategories.Global);
        for (const locale of LodestoneLocales) {
            for (let idx in globalTypes) {
                let type = globalTypes[idx];
                jobs.push(await PromiseAdv.delay(1000).return(this.executePublish(type as NewsCategoryGlobal, NewsCategories.Global[type as keyof typeof NewsCategoryGlobal], locale)));
            }
        }
        // 한국
        let koreaTypes = Object.keys(NewsCategories.Korea);
        for (let idx in koreaTypes) {
            let type = koreaTypes[idx];
            jobs.push(await PromiseAdv.delay(1000).return(this.executePublish(type as NewsCategoryKorea, NewsCategories.Korea[type as keyof typeof NewsCategoryKorea], 'kr')));
        }

        return jobs;
    }

    private async sendNews(pHookUrl: string, pPost: {embeds: MessageEmbed[]}, pLocale: string, pType: NewsCategoryGlobal|NewsCategoryKorea) {
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
                        Logger.err('There is no sending response error message.');
                        await this.webHookCache.addResendItem(pHookUrl, pPost, pLocale, pType);
                        resolve('fail');
                    } else {
                        Logger.err(err.config);
                        Logger.err(err.response);

                        // 정상 요청이 아님
                        if (err.response.status === 400) {
                            if (err.response.data) {
                                // Webhook 제거됨
                                if (err.response.data.code === 10015) {
                                    await this.webHookCache.delUrl(pLocale, pType, pHookUrl);
                                    Logger.info(`웹 후크 삭제됨 > ${pLocale}, ${pType} - ${pHookUrl}`);
                                    resolve('removed');
                                } else {
                                    await this.webHookCache.addResendItem(pHookUrl, pPost, pLocale, pType);
                                    resolve('fail');
                                }
                            } else {
                                Logger.err('something error occured');
                                await this.webHookCache.addResendItem(pHookUrl, pPost, pLocale, pType);
                                resolve('fail');
                            }
                            // 요청을 너무 많이 보냄
                        } else if (err.response.status === 429) {
                            await PromiseAdv.delay(err.response.data.retry_after);
                            await this.webHookCache.addResendItem(pHookUrl, pPost, pLocale, pType);
                            resolve('limited');
                            // 웹 후크가 없음
                        } else if (err.response.status === 404) {
                            if (err.response.data) {
                                // Webhook 제거됨
                                if (err.response.data.code === 10015) {
                                    await this.webHookCache.delUrl(pLocale, pType, pHookUrl);
                                    Logger.info(`웹 후크 삭제됨 > ${pLocale}, ${pType} - ${pHookUrl}`);
                                    resolve('removed');
                                } else {
                                    await this.webHookCache.addResendItem(pHookUrl, pPost, pLocale, pType);
                                    resolve('fail');
                                }
                            } else {
                                Logger.err('something error occured');
                                await this.webHookCache.addResendItem(pHookUrl, pPost, pLocale, pType);
                                resolve('fail');
                            }
                            // 그 외
                        } else {
                            console.error(err);
                            await this.webHookCache.addResendItem(pHookUrl, pPost, pLocale, pType);
                            resolve('fail');
                        }
                    }
                });
        });
    }
}

class WebhookCache
{
    private redisCon: any;
    constructor(redisCon: any) {
        this.redisCon = redisCon;
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
     * @param pType 카테고리
     * @return 게시글 id
     */
    async addId(pData: Array<NewsContent>, pLocale: string, pType: NewsCategoryGlobal|NewsCategoryKorea) {
        if (!pData) {
            Logger.err(`There is no post cache.`);
            return [];
        }

        let propSet: any = {};
        pData.forEach(d => {
            propSet[d.idx] = this.redisCon.sAdd(`${pLocale}-${pType}-ids`, d.idx);
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
}