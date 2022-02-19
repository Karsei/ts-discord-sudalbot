import cheerio, {CheerioAPI} from 'cheerio';
import axios from 'axios';

/**
 * 가이드 아이템 검색
 */
export default class GuideItemFetcher {
    /**
     * 글로벌 서비스 소식을 가져와서 파싱합니다.
     * @param pSearchWord 검색 단어
     */
    static async searchItemUrl(pSearchWord: string): Promise<string> {
        const baseUrl = `https://guide.ff14.co.kr/lodestone/search?keyword=${encodeURIComponent(pSearchWord)}`;
        const pageData = await axios.get(baseUrl);
        return GuideItemParser.parseItemUrl(cheerio.load(pageData.data), pSearchWord);
    }
}

/**
 * 가이드 아이템 파서
 */
class GuideItemParser {
    /**
     * 아이템 정보 주소 가져오기
     * @param $ parse 구조체
     */
    static parseItemUrl($: CheerioAPI, pSearchWord: string): string {
        let findUrl = '';

        let $targetTable = $('.base_tb');
        let $list = $targetTable.find('tr');
        if ($list && $list.length > 0) {
            $list.each(function () {
                const $conItem = $(this).find('td:first');
                const $title = $conItem.find('a').text() || '';
                if ($title == pSearchWord) {
                    findUrl = `https://guide.ff14.co.kr${$conItem.find('a').attr('href')}`;
                    return false;
                }
            });
        }
        return findUrl;
    }
}