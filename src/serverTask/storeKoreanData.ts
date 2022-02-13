const axios = require('axios');
// Logger
const Logger = require('../libs/logger');

export default class StoreKoreanData
{
    private static items: Array<object>;
    private static itemUiCategories: Array<object>;

    private static async fetchCsv(pName: string) {
        return axios.get(`https://raw.githubusercontent.com/Ra-Workspace/ffxiv-datamining-ko/master/csv/${pName}.csv`);
    }

    private static readCsv(pContent: string) {
        let inQuote = false;
        let lineBuf = '';
        let lines = [];
        let line = [];
        for (let strIdx = 0, strTotal = pContent.length; strIdx < strTotal; strIdx++) {
            const chr = pContent[strIdx];
            if (inQuote) {
                if (chr === '"') {
                    inQuote = false;
                } else {
                    lineBuf += chr;
                }
                continue;
            }

            switch (chr) {
                case ',':
                    line.push(lineBuf)
                    lineBuf = ''
                    break;
                case '"':
                    inQuote = !inQuote
                    break;
                case '\r': // @todo: find a better way to handle \r
                    break;
                case '\n':
                    line.push(lineBuf)
                    lineBuf = ''
                    lines.push(line)
                    line = []
                    break;
                default:
                    lineBuf += chr
                    break;
            }
        }
        if (line.length) {
            lines.push(line);
        }

        let fields = lines[1];
        return lines.slice(3).map(line => fields.reduce((obj: any, field, i) => {
            const content = line[i].replace(/\r\n/g, '\n');
            if (field) {
                obj[field] = content
            } else {
                obj[`#${i}`] = content
            }

            return obj
        }, { _: line }));
    }

    static async init() {
        this.items = await this.fetch('Item');
        this.itemUiCategories = await this.fetch('ItemUICategory');
    }

    private static async fetch(pName: string): Promise<any[]> {
        const csvRes: any = await this.fetchCsv(pName);
        if (!csvRes.hasOwnProperty('data') || csvRes['data'].length <= 0) {
            Logger.info('데이터가 존재하지 않습니다.');
            return new Promise(() => {});
        }

        // 데이터 구성
        const data: Array<any> = this.readCsv(csvRes['data']);
        if (data.length <= 0) {
            throw new Error('데이터 구성에 실패하였습니다.');
        }

        return data;
    }

    static getItems() { return this.items; }
    static getItemUiCategories() { return this.itemUiCategories; }
}
