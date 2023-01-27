import { load as CheerioAPILoad } from 'cheerio';

export class GuideParseHelper {
  /**
   * 아이템 정보 주소 가져오기
   * @param data 웹 데이터
   */
  static parseItemUrl(data: string, searchWord: string): string {
    const $ = CheerioAPILoad(data);
    let findUrl = '';

    let $targetTable = $('.base_tb');
    let $list = $targetTable.find('tr');
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
