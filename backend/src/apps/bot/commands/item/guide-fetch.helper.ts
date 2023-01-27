import axios from 'axios';

import { GuideParseHelper } from './guide-parse.helper';

export class GuideFetchHelper {
  /**
   * 글로벌 서비스 소식을 가져와서 파싱합니다.
   * @param pSearchWord 검색 단어
   */
  static async searchItemUrl(pSearchWord: string): Promise<string> {
    const baseUrl = `https://guide.ff14.co.kr/lodestone/search?keyword=${encodeURIComponent(
      pSearchWord,
    )}`;
    const pageData = await axios.get(baseUrl);
    return GuideParseHelper.parseItemUrl(pageData.data, pSearchWord);
  }
}
