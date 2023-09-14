import axios from 'axios';
import { load as CheerioAPILoad } from 'cheerio';
import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common';

import { LodestoneLoadPort } from '../../port/out/lodestone-load-port.interface';

@Injectable()
export class OfficialSiteAdapter implements LodestoneLoadPort {
  constructor(
    @Inject(Logger)
    private readonly loggerService: LoggerService,
  ) {}

  async searchItemUrl(searchWord: string): Promise<string> {
    const baseUrl = `https://guide.ff14.co.kr/lodestone/search?keyword=${encodeURIComponent(
      searchWord,
    )}`;
    const pageData = await axios.get(baseUrl);
    return this.parseItemUrl(pageData.data, searchWord);
  }

  /**
   * 아이템 정보 주소 가져오기
   * @param data 웹 데이터
   * @param searchWord 검색할 단어
   */
  private parseItemUrl(data: string, searchWord: string): string {
    const $ = CheerioAPILoad(data);
    let findUrl = '';

    const $targetTable = $('.base_tb');
    const $list = $targetTable.find('tr');
    if ($list && $list.length > 0) {
      $list.each(function () {
        const $conItem = $(this).find('td:first');
        const $title = $conItem.find('a').text() || '';
        if ($title === searchWord) {
          findUrl = `https://guide.ff14.co.kr${$conItem
            .find('a')
            .attr('href')}`;
          return false;
        }
      });
    }
    return findUrl;
  }
}
