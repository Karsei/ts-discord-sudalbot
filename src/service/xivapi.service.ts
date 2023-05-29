const axios = require('axios');
// Config
import Setting from '../definition/setting';

export default class XivapiService
{
    private static async fetchXivApiGet(pUrl: string, pData: object) {
        return await axios.get(`${pUrl}`, {
            params: {
                ...pData,
                'private_key': Setting.XIVAPI_KEY
            }
        });
    }

    private static async fetchXivApiPost(pUrl: string, pData: object) {
        return await axios.post(`${pUrl}`, {
            ...pData,
            'private_key': Setting.XIVAPI_KEY
        });
    }

    static async fetchSearch(pIndexes: string, pString: string, pStringAlgo = 'wildcard', pStringColumn = '', pPage = '', pSortField = '', pSortOrder = '', pLimit = '') {
        let params: any = {
            indexes: pIndexes,
            string: pString,
            string_algo: pStringAlgo,
            page: pPage,
            sort_field: pSortField,
            sort_order: pSortOrder,
            limit: pLimit,
        };
        if (pStringColumn.length > 0)   params['string_column'] = pStringColumn;
        return await this.fetchXivApiGet(`https://xivapi.com/search`, params);
    }

    static async fetchElasticSearch(pIndexes: string, pBody: object, pColumn: string = 'ID,Name') {
        let data: any = {
            indexes: pIndexes,
            body: pBody,
        };
        if (pColumn.length > 0) data['columns'] = pColumn;
        return await this.fetchXivApiPost(`https://xivapi.com/search`, data);
    }

    static async fetchItem(pId: number, pLimit = '100') {
        let params = {
            limit: pLimit,
        };
        return await this.fetchXivApiGet(`https://xivapi.com/item/${pId}`, params);
    }

    static async fetchInstance(pId: number, pLimit = '100') {
        let params = {
            limit: pLimit,
        };
        return await this.fetchXivApiGet(`https://xivapi.com/instancecontent/${pId}`, params);
    }
}