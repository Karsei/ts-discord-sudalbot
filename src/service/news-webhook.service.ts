import axios from 'axios';
import {MessageEmbed} from 'discord.js';
const PromiseAdv = require('bluebird');
const Logger = require('../lib/logger');
// Service
import NewsArchiveService from "./news-archive-service";
// Config
import NewsContent from '../definition/newsContent';
import NewsCategories, {NewsCategoryContents, NewsCategoryGlobal, NewsCategoryKorea} from '../definition/newsCategories';
import LodestoneLocales from '../definition/lodestoneLocales';
import BotAuthParams from '../definition/botAuthParams';
import Setting from '../definition/setting';

/**
 * 소식 웹훅 서비스
 */
export default class NewsWebhookService
{
    private readonly discordBot: any;
    private readonly newsArchiveService: NewsArchiveService;
    constructor(discordBot: any, newsArchiveService: NewsArchiveService) {
        this.discordBot = discordBot;
        this.newsArchiveService = newsArchiveService;
    }

    /**
     * 서버에 Webhook 을 생성합니다.
     * @param pParams 필요 파라미터
     */
    async subscribe(pParams: BotAuthParams) {
        const guildId = pParams.guild_id;
        const code = pParams.code;

        // Webhook 주소 생성
        const redirectUrl = `${Setting.DISCORD_URL_BOT_HOST}/authorize`;
        const hookUrlRes: { url: string; hookData: object } = await NewsWebhookService.makeWebhookUrl(code, redirectUrl);
        const hookUrl: string = hookUrlRes.url;

        // 나라별 소식
        // 한국
        Object.keys(NewsCategories.Korea).map(type => {
            this.discordBot.redis.addUrl('kr', type, hookUrl);
        });
        // 글로벌
        Object.keys(NewsCategories.Global).map(type => {
            LodestoneLocales.forEach(locale => {
                // 당분간 북미 기준으로 topics, updates, developers 만 허용
                if (['topics', 'updates', 'developers'].indexOf(type) > -1 && ['na'].indexOf(locale) > -1) {
                    this.discordBot.redis.addUrl(locale, type, hookUrl);
                }
            });
        });

        // Redis 에 서버별로 Webhook 주소 등록 (기본 등록)
        await this.discordBot.redis.addGuildsAll(guildId, hookUrl);

        // Webhook 추가
        let existWebhook = await this.discordBot.redis.checkInAllWebhooks(hookUrl);
        if (!existWebhook) {
            await this.discordBot.redis.addUrlAll(hookUrl);
            Logger.info(`${guildId} - ${hookUrl} 등록 완료`);
        }

        // 메세지 보냄
        return hookUrl;
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

    async publishAll() {
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

    async publishGlobal(pType: NewsCategoryGlobal, pLocale: string) {
        // 제공 카테고리 양식
        const content: NewsCategoryContents = NewsCategories.Global[pType];

        // 최신 소식을 가져오면서 Redis에 넣음
        const fetchPosts = await this.newsArchiveService.fetchGlobal(pType, pLocale, true);
        const newPosts = await this.discordBot.redis.addId(fetchPosts, pLocale, pType);

        // Redis에 등록할 때 새로운 글이 없다면 그냥 끝냄
        if (newPosts.length === 0) return newPosts;

        // Webhook 등록된 서버들에게 메세지를 전송한다.
        await this.sendMessageWithMembers(newPosts, content, pType.toString(), pLocale);
    }

    async publishKorea(pType: NewsCategoryKorea) {
        // 제공 카테고리 양식
        const pLocale = 'kr';
        const content: NewsCategoryContents = NewsCategories.Korea[pType];

        // 최신 소식을 가져오면서 Redis에 넣음
        const fetchPosts = await this.newsArchiveService.fetchKorea(pType, true);
        const newPosts = await this.discordBot.redis.addId(fetchPosts, pLocale, pType);

        // Redis에 등록할 때 새로운 글이 없다면 그냥 끝냄
        if (newPosts.length === 0) return newPosts;

        // Webhook 등록된 서버들에게 메세지를 전송한다.
        await this.sendMessageWithMembers(newPosts, content, pType.toString(), pLocale);
    }

    private async sendMessageWithMembers(pNewsPosts: NewsContent[], pCategoryInfo: NewsCategoryContents, pTypeStr: string, pLocale: string) {
        // 디스코드에 전달할 메세지를 생성한다.
        const newEmbedPosts = this.makeEmbedPostMessages(pNewsPosts, pCategoryInfo, pLocale);

        // Redis에서 모든 등록된 웹훅 주소를 불러온 후, Embed는 10개씩 한 묶음으로, Webhook은 20개씩 한 묶음으로 구성해서 전송한다.
        // 이때 Discord 웹훅 제한이 걸릴 수 있으므로 주의할 것
        const res: Array<string> = await this.discordBot.redis.sMembers(`${pLocale}-${pTypeStr}-webhooks`);
        if (res) {
            await this.sendMessage(res, newEmbedPosts, pTypeStr, pLocale);
        }
    }

    private makeEmbedPostMessages(pPosts: NewsContent[], pCategoryContent: NewsCategoryContents, pLocale: string): Array<MessageEmbed> {
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
                    text: Setting.APP_NAME as string,
                });
        });
    }

    private async sendMessage(pWhiteList: Array<string>, pNewEmbedPosts: Array<MessageEmbed>, pTypeStr: string, pLocale: string) {
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
    private async sendNews(pHookUrl: string, pPost: {embeds: MessageEmbed[]}, pTypeStr: string, pLocale: string) {
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
                        await this.discordBot.redis.addResendItem(pHookUrl, pPost, pLocale, pTypeStr);
                        resolve('fail');
                    } else {
                        Logger.error('소식을 디스코드 서버에 전송하는 과정에서 오류가 발생했습니다. 원인을 분석합니다...', err);

                        // 정상 요청이 아님
                        if (err.response.status === 400) {
                            if (err.response.data) {
                                // Webhook 제거됨
                                if (err.response.data.code === 10015) {
                                    Logger.info(`존재하지 않는 Webhook 입니다. 삭제를 시도합니다...`);
                                    await this.discordBot.redis.delUrl(pLocale, pTypeStr, pHookUrl);
                                    Logger.info(`웹 후크가 삭제되었습니다. > ${pLocale}, ${pTypeStr} - ${pHookUrl}`);
                                    resolve('removed');
                                } else {
                                    await this.discordBot.redis.addResendItem(pHookUrl, pPost, pLocale, pTypeStr);
                                    resolve('fail');
                                }
                            } else {
                                Logger.error('something error occured');
                                await this.discordBot.redis.addResendItem(pHookUrl, pPost, pLocale, pTypeStr);
                                resolve('fail');
                            }
                            // 요청을 너무 많이 보냄
                        } else if (err.response.status === 429) {
                            Logger.info(`과도한 요청으로 인해 다시 재전송을 시도합니다...`);
                            await PromiseAdv.delay(err.response.data.retry_after);
                            await this.discordBot.redis.addResendItem(pHookUrl, pPost, pLocale, pTypeStr);
                            resolve('limited');
                            // 웹 후크가 없음
                        } else if (err.response.status === 404) {
                            if (err.response.data) {
                                // Webhook 제거됨
                                if (err.response.data.code === 10015) {
                                    Logger.info(`존재하지 않는 Webhook 입니다. 삭제를 시도합니다...`);
                                    await this.discordBot.redis.delUrl(pLocale, pTypeStr, pHookUrl);
                                    Logger.info(`웹 후크가 삭제되었습니다. > ${pLocale}, ${pTypeStr} - ${pHookUrl}`);
                                    resolve('removed');
                                } else {
                                    await this.discordBot.redis.addResendItem(pHookUrl, pPost, pLocale, pTypeStr);
                                    resolve('fail');
                                }
                            } else {
                                Logger.error('소식을 보내는 과정에서 알 수 없는 오류가 발생했습니다.');
                                await this.discordBot.redis.addResendItem(pHookUrl, pPost, pLocale, pTypeStr);
                                resolve('fail');
                            }
                            // 그 외
                        } else {
                            await this.discordBot.redis.addResendItem(pHookUrl, pPost, pLocale, pTypeStr);
                            resolve('fail');
                        }
                    }
                });
        });
    }

    /**
     * 실패한 게시글을 다시 각 디스코드 서버에 배포합니다.
     */
    async publishResendAll() {
        let count = await this.discordBot.redis.getResendItemLength();
        if (count == 0) return;

        Logger.info(`총 ${count}개의 게시글을 다시 전송합니다...`);
        let allCount = count;
        let success = 0;

        while (count > 0) {
            let cachedData = await this.discordBot.redis.popResendItem();
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
            count = await this.discordBot.redis.getResendItemLength();
        }

        Logger.info(`총 ${allCount}개의 게시글 중에서 ${success}개가 재전송을 하는데 성공하였습니다.`);
    }
}