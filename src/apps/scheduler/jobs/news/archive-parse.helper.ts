import { CheerioAPI, load as CheerioAPILoad } from 'cheerio';
import { NewsContent } from '../../../../types/archive.constant';
import { ArchiveFetchHelper } from './archive-fetch.helper';

export class ArchiveParseHelper {
    /**
     * 글로벌 - 일반 소식 조회
     * @param $ parse 구조체
     * @param pLocaleBaseUrl 소식 주소
     */
    static parseGlobalNews($: CheerioAPI, pLocaleBaseUrl: string): NewsContent[] {
        const list: NewsContent[] = [];
        const $targetTable = $('.news__content');
        const $list = $targetTable.find('li.news__list');
        if ($list && $list.length > 0) {
            $list.each(function (idx, data) {
                const _url = $(this).find('a')?.attr('href') || '';
                const _script = $(this).find('script').html() || '';
                const parseDetail: NewsContent = {
                    idx: _url.match(/[^/]+$/)?.at(0) || '',
                    url: `${pLocaleBaseUrl}${_url}`,
                    title: $(this).find('p.news__list--title').text().replace(/(\[.*\])|(\r\n|\n|\r)/gm, '').trim(),
                    timestamp: parseInt(_script.match(/ldst_strftime\((\d+)./)?.at(1) || '') * 1000,
                };

                list.push(parseDetail);
            });
        }
        return list;
    }

    /**
     * 글로벌 - 토픽 소식 조회
     * @param $ parse 구조체
     * @param pLocaleBaseUrl 소식 주소
     */
    static parseGlobalTopics($: CheerioAPI, pLocaleBaseUrl: string): NewsContent[] {
        const list: NewsContent[] = [];
        const $targetTable = $('.news__content');
        const $list = $targetTable.find('li.news__list--topics');
        if ($list && $list.length > 0) {
            $list.each(function (idx, data) {
                const _url = $(this).find('p.news__list--title > a').attr('href') || '';
                const _detail = $(this).find('div.news__list--banner').find('p:eq(1)').text();
                const _script = $(this).find('script').html() || '';
                const parseDetail: NewsContent = {
                    idx: _url.match(/[^/]+$/)?.at(0) || '',
                    url: `${pLocaleBaseUrl}${_url}`,
                    title: $(this).find('p.news__list--title').text().replace(/([\r\n|\n|\r])/gm, '').trim(),
                    timestamp: parseInt(_script.match(/ldst_strftime\((\d+)./)?.at(1) || '') * 1000,
                    thumbnail: $(this).find('img').attr('src') || '',
                    description: _detail.replace(/([\r\n|\n|\r])/gm, '').trim()
                };

                list.push(parseDetail);
            });
        }
        return list;
    }

    /**
     * 글로벌 - 개발자 노트 소식 조회
     * @param $ parse 구조체
     */
    static parseGlobalDeveloper($: CheerioAPI): NewsContent[] {
        const list: NewsContent[] = [];
        const $list = $('entry');
        if ($list && $list.length > 0) {
            $list.each(function (idx, data) {
                let $findContent = $(this).find('content').html();
                if ($findContent) {
                    $findContent = `${$findContent}`.trim().replace(/<!--\[CDATA\[<([\w]+)-->/, '<$1>');
                } else {
                    $findContent = '';
                }
                let $content = CheerioAPILoad($findContent);
                let descs: any[] = [];
                $content('p').slice(0, 3).each(function (idx, ele) { if ($(this).text().length > 0) descs.push($(this).text()); });

                const parseDetail: NewsContent = {
                    idx: $(this).find('id').text(),
                    url: $(this).find('link').attr('href') || '',
                    title: $(this).find('title').text().replace(/([\r\n|\n|\r])/gm, '').trim(),
                    timestamp: parseInt($(this).find('published').text().replace(/([\r\n|\n|\r])/gm, '').trim()),
                    description: descs.join('\n\n')
                };

                list.push(parseDetail);
            });
        }
        return list;
    }

    /**
     * 글로벌 - 점검 소식 조회
     * @param $ parse 구조체
     * @param pLocaleBaseUrl 소식 주소
     * @param pLocale 언어
     */
    static async parseGlobalMaintenance($: CheerioAPI, pLocaleBaseUrl: string, pLocale: string): Promise<NewsContent[]> {
        const list: NewsContent[] = [];
        const $targetTable = $('.news__content');
        const $list = $targetTable.find('li.news__list');
        if ($list && $list.length > 0) {
            $list.each(function (idx, data) {
                const _url = $(this).find('a').attr('href') || '';
                const _script = $(this).find('script').html() || '';
                const parseDetail: NewsContent = {
                    idx: _url.match(/[^/]+$/)?.at(0) || '',
                    url: `${pLocaleBaseUrl}${_url}`,
                    title: $(this).find('p.news__list--title').text().replace(/(\[.*\])|(\r\n|\n|\r)/gm, '').trim(),
                    timestamp: parseInt(_script.match(/ldst_strftime\((\d+)./)?.at(1) || '') * 1000,
                    description: '',
                };

                list.push(parseDetail);
            });

            for (let idx in list) {
                if (list[idx].url) {
                    list[idx].description = await ArchiveFetchHelper.withGlobalSubs(list[idx].url, 'maintenance', pLocale);
                }
            }
        }
        return list;
    }

    /**
     * 글로벌 - 점검 하위 소식 조회
     * @param $ parse 구조체
     * @param pLocale 언어
     */
    static parseGlobalMaintenanceSub($: CheerioAPI, pLocale: string): string {
        let content = '';
        let textBox = $('.news__detail__wrapper');
        if (textBox.length > 0) {
            const TIMESTAMP_REGEX = {
                'jp': /日　時：(.*)より(?:[\r\n|\r|\n]?)(.*:[\d]{2})/gmi,
                'na': /(\w{3}\.? \d{1,2}, \d{4})? (?:from )?(\d{1,2}:\d{2}(?: [ap]\.m\.)?)(?: \((\w+)\))?/gi,
                'eu': /(\w{3}\.? \d{1,2}, \d{4})? (?:from )?(\d{1,2}:\d{2}(?: [ap]\.m\.)?)(?: \((\w+)\))?/gi,
                'de': /(\d{1,2}\. \w{3}\.? \d{4})? (?:von |um )?(\d{1,2}(?::\d{2})? Uhr)(?: \((\w+)\))?/gi,
            };
            // const I18N_MONTHS = {
            //     'de': { 'Jan': 'Jan', 'Feb': 'Feb', 'Mär': 'Mar', 'Apr': 'Apr', 'Mai': 'May', 'Jun': 'Jun', 'Jul': 'Jul', 'Aug': 'Aug', 'Sep': 'Sep', 'Okt': 'Oct', 'Nov': 'Nov', 'Dez': 'Dec' },
            // };
            // const I18N_DAYS = {
            //     'de': { 'So': 'Sun', 'Mo': 'Mon', 'Di': 'Tue', 'Mi': 'Wed', 'Do': 'Thu', 'Fr': 'Fri', 'Sa': 'Sat' },
            // };

            let text = textBox.text();
            let parseText = {
                'start': '',
                'end': '',
            };
            if (Object.keys(TIMESTAMP_REGEX).indexOf(pLocale) == -1) return '';

            let m = null;
            let regex = TIMESTAMP_REGEX[pLocale as keyof typeof TIMESTAMP_REGEX];

            if (pLocale == 'jp') {
                let breakOver = false;
                while ((m = regex.exec(text)) !== null) {
                    if (m.index === regex.lastIndex) {
                        regex.lastIndex++;
                    }
                    if (breakOver)  break;
                    breakOver = true;

                    if (m[1])   parseText['start'] = (m[1] || '').trim();
                    if (m[2])   parseText['end'] = (m[2] || '').trim();
                }


            } else {
                let countOver = 0;
                while ((m = regex.exec(text)) !== null) {
                    if (m.index === regex.lastIndex) {
                        regex.lastIndex++;
                    }
                    if (countOver > 1)  break;
                    if (countOver == 0) {
                        if (m[0])   parseText['start'] = (m[0] || '').trim();
                    } else {
                        if (m[0])   parseText['end'] = (m[0] || '').trim();
                    }
                    countOver++;
                }
            }

            if (parseText['start'].length > 0)  content += `${parseText['start']}`;
            if (parseText['end'].length > 0)  content += ` ~ ${parseText['end']}`;
        }

        return content;
    }

    static parseKoreaNews($: CheerioAPI, pLocaleBaseUrl: string): NewsContent[] {
        let list: NewsContent[] = [];
        let $targetTable = $('.ff14_board_list');
        let $list = $targetTable.find('tr');
        if ($list && $list.length > 0) {
            $list.each(function (idx, data) {
                if ($(this).find('th').length > 0)  return true;

                let $title = $(this).find('td span.title');

                const parseDetail: NewsContent = {
                    idx: $(this).find('td.num').html() || '',
                    title: ($title.find('strong').html() || '').replace(/([\r\n|\n|\r])/gm, '').trim(),
                    url: `${pLocaleBaseUrl}${$title.find('a').attr('href')}`
                }

                list.push(parseDetail);
            });
        }
        return list;
    }

    static parseKoreaNotice($: CheerioAPI, pLocaleBaseUrl: string): NewsContent[] {
        let list: NewsContent[] = [];
        let $targetTable = $('.ff14_board_list');
        let $list = $targetTable.find('tr');
        if ($list && $list.length > 0) {
            $list.each(function (idx, data) {
                if ($(this).find('th').length > 0)  return true;

                let $title = $(this).find('td span.title');

                const parseDetail: NewsContent = {
                    idx: $(this).find('td.num').html() || '',
                    title: ($title.find('strong').html() || '').replace(/([\r\n|\n|\r])/gm, '').trim(),
                    url: `${pLocaleBaseUrl}${$title.find('a').attr('href')}`,
                    thumbnail: 'http://static.ff14.co.kr/Contents/2019/04/0B93217EE978FE3F5AFFD847A20A55D20FF200821CBB6124AFDFEC38384E2FC8.jpg'
                }

                list.push(parseDetail);
            });
        }
        return list;
    }

    static async parseKoreaMaintenance($: CheerioAPI, pLocaleBaseUrl: string): Promise<NewsContent[]> {
        let list: NewsContent[] = [];
        let $targetTable = $('.ff14_board_list');
        let $list = $targetTable.find('tr');
        if ($list && $list.length > 0) {
            $list.each(function (idx, data) {
                if ($(this).find('th').length > 0)  return true;

                let $title = $(this).find('td span.title');

                const parseDetail: NewsContent = {
                    idx: $(this).find('td.num').html() || '',
                    title: ($title.find('strong').html() || '').replace(/([\r\n|\n|\r])/gm, '').trim(),
                    url: `${pLocaleBaseUrl}${$title.find('a').attr('href')}`,
                    thumbnail: 'http://static.ff14.co.kr/Contents/2019/07/97809A6EB08E63368C57F973277459AD7AC75C71426E2D0B0613FE636FA63706.jpg'
                }

                list.push(parseDetail);
            });

            for (let idx in list) {
                if (list[idx].url) {
                    list[idx].description = await ArchiveFetchHelper.withKoreaSubs(list[idx].url, 'maintenance');
                }
            }
        }
        return list;
    }

    static parseKoreaUpdate($: CheerioAPI, pLocaleBaseUrl: string): NewsContent[] {
        let list: NewsContent[] = [];
        let $targetTable = $('.ff14_board_list');
        let $list = $targetTable.find('tr');
        if ($list && $list.length > 0) {
            $list.each(function (idx, data) {
                if ($(this).find('th').length > 0)  return true;

                let $title = $(this).find('td span.title');

                const parseDetail: NewsContent = {
                    idx: $(this).find('td.num').html() || '',
                    title: ($title.find('strong').html() || '').replace(/([\r\n|\n|\r])/gm, '').trim(),
                    url: `${pLocaleBaseUrl}${$title.find('a').attr('href')}`,
                    thumbnail: 'http://static.ff14.co.kr/Contents/2015/10/2015103017255463465.jpg'
                }

                list.push(parseDetail);
            });
        }
        return list;
    }

    static parseKoreaEvent($: CheerioAPI, pLocaleBaseUrl: string): NewsContent[] {
        let list: NewsContent[] = [];
        let $targetTable = $('.banner_list.event');
        let $list = $targetTable.find('li > a');
        if ($list && $list.length > 0) {
            $list.each(function (idx, data) {
                let url = $(this).attr('href') || '';

                let $thumbnail = $(this).find('span.banner_img').attr('style') || '';
                let _thumbnail = $thumbnail.split(`'`);

                const parseDetail: NewsContent = {
                    idx: url.split(`?`)[0].split(`/`).slice(-1)[0],
                    title: ($(this).find('span.txt').html() || '').replace(/([\r\n|\n|\r])/gm, '').trim(),
                    url: `${pLocaleBaseUrl}${url}`,
                    thumbnail: `https:${_thumbnail[1]}`,
                    summary: ($(this).find('.summary.dot').html() || '').replace(/([\r\n|\n|\r])/gm, '').trim()
                }

                list.push(parseDetail);
            });
        }
        return list;
    }

    static parseKoreaPatchNote($: CheerioAPI, pLocaleBaseUrl: string): NewsContent[] {
        let list: NewsContent[] = [];
        let $targetTable = $('.banner_list.note');
        let $list = $targetTable.find('li > a');
        if ($list && $list.length > 0) {
            $list.each(function (idx, data) {

                let $thumbnail = $(this).find('span.banner_img').attr('style') || '';
                let _thumbnail = $thumbnail.split(`'`);

                const parseDetail: NewsContent = {
                    idx: $(this).find('span.num').html() || '',
                    title: ($(this).find('span.txt').html() || '').replace(/([\r\n|\n|\r])/gm, '').trim(),
                    url: `${pLocaleBaseUrl}${$(this).attr('href')}`,
                    thumbnail: `https:${_thumbnail[1]}`
                }

                list.push(parseDetail);
            });
        }
        return list;
    }

    static parseKoreaMaintenanceSub($: CheerioAPI): string {
        let content = '';
        let textBox = $('.board_view_box');
        if (textBox.length > 0) {
            let text = textBox.text();

            let list = {
                date: [] as any,
                content: [] as any,
            };
            let countBreak = 0;
            // 일시
            let regex = /일시[ :-]+(.*)/gm;
            let m = null;
            while ((m = regex.exec(text)) !== null) {
                if (m.index === regex.lastIndex) {
                    regex.lastIndex++;
                }
                if (m[1])   list.date.push((m[1] || '').trim());

                if (countBreak > 10) {
                    console.error('something error');
                    break;
                }
                countBreak++;
            }
            // 내용
            regex = /내용[ :-]+(.*)/gm;
            m = null;
            countBreak = 0;
            while ((m = regex.exec(text)) !== null) {
                if (m.index === regex.lastIndex) {
                    regex.lastIndex++;
                }
                if (m[1])   list.content.push((m[1] || '').trim());

                if (countBreak > 10) {
                    console.error('something error');
                    break;
                }
                countBreak++;
            }

            let count = 1;
            if (list.date.length == list.content.length) {
                for (let idx in list.date) {
                    if (content.length > 0) content += `\n`;
                    content += `${count++}. ${list.content[idx]}\n`;
                    content += ` - ${list.date[idx]}`;
                }
            } else {
                content += `${list.date[0]}`;
            }
        }
        return content;
    }
}
