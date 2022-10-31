import { load as CheerioAPILoad } from 'cheerio';

import { NewsContent } from './archive.constant';
import { ArchiveParseHelper } from './archive-parse.helper';

const axios = require('axios');

export class ArchiveFetchHelper {
    /**
     * 글로벌 서비스 소식을 가져와서 파싱합니다.
     * @param url 로드스톤 주소
     * @param type 카테고리
     * @param locale 언어
     */
    static async withGlobal(url: string, type: string, locale: string): Promise<Array<NewsContent>> {
        const localeBaseUrl = `https://${locale}.finalfantasyxiv.com`;
        const pageData = await axios.get(`${localeBaseUrl}${url}`);
        const pageParsed = CheerioAPILoad(pageData.data);
        switch (type) {
            case 'topics':
                return ArchiveParseHelper.parseGlobalTopics(pageParsed, localeBaseUrl);
            case 'developers':
                return ArchiveParseHelper.parseGlobalDeveloper(pageParsed);
            case 'maintenance':
                return ArchiveParseHelper.parseGlobalMaintenance(pageParsed, localeBaseUrl, locale);
            default:
                return ArchiveParseHelper.parseGlobalNews(pageParsed, localeBaseUrl);
        }
    }

    /**
     * 글로벌 서비스 하위 소식을 가져와서 파싱합니다.
     * @param url 로드스톤 주소
     * @param subType 카테고리
     * @param locale 언어
     */
    static async withGlobalSubs(url: string, subType: string, locale: string): Promise<string> {
        const pageData = await axios.get(url);
        const pageParsed = CheerioAPILoad(pageData.data);
        switch (subType) {
            case 'maintenance':
                return ArchiveParseHelper.parseGlobalMaintenanceSub(pageParsed, locale);
            default:
                return new Promise(() => {});
        }
    }

    /**
     * 한국 서비스 소식을 가져와서 파싱합니다.
     * @param url 한국 서비스 주소
     * @param type 카테고리
     */
    static async withKorea(url: string, type: string): Promise<Array<NewsContent>> {
        const localeBaseUrl = `https://www.ff14.co.kr`;
        const pageData = await axios.get(`${localeBaseUrl}${url}`);
        const pageParsed = CheerioAPILoad(pageData.data);
        switch (type) {
            case 'patchnote':
                return ArchiveParseHelper.parseKoreaPatchNote(pageParsed, localeBaseUrl);
            case 'event':
                return ArchiveParseHelper.parseKoreaEvent(pageParsed, localeBaseUrl);
            case 'maintenance':
                return ArchiveParseHelper.parseKoreaMaintenance(pageParsed, localeBaseUrl);
            case 'updates':
                return ArchiveParseHelper.parseKoreaUpdate(pageParsed, localeBaseUrl);
            case 'notices':
                return ArchiveParseHelper.parseKoreaNotice(pageParsed, localeBaseUrl);
            default:
                return ArchiveParseHelper.parseKoreaNews(pageParsed, localeBaseUrl);
        }
    }

    /**
     * 한국 서비스 하위 소식을 가져와서 파싱합니다.
     * @param url 한국 서비스 주소
     * @param subType 카테고리
     */
    static async withKoreaSubs(url: string, subType: string): Promise<string> {
        const pageData = await axios.get(url);
        const pageParsed = CheerioAPILoad(pageData.data);
        switch (subType) {
            case 'maintenance':
                return ArchiveParseHelper.parseKoreaMaintenanceSub(pageParsed);
            default:
                return new Promise(() => {});
        }
    }
}
