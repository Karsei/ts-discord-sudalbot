import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface FetchXivApiSearchProps {
  indexes: string;
  string?: string;
  string_algo?: string;
  page?: string;
  sort_field?: string;
  sort_order?: string;
  limit?: string;
}

@Injectable()
export class XivapiService {
  constructor(private readonly configService: ConfigService) {}

  async fetchSearch(
    pIndexes: string,
    pString: string,
    pStringAlgo = 'wildcard',
    pStringColumn = '',
    pPage = '',
    pSortField = '',
    pSortOrder = '',
    pLimit = '',
  ) {
    const params: FetchXivApiSearchProps = {
      indexes: pIndexes,
      string: pString,
      string_algo: pStringAlgo,
      page: pPage,
      sort_field: pSortField,
      sort_order: pSortOrder,
      limit: pLimit,
    };
    if (pStringColumn.length > 0) params['string_column'] = pStringColumn;
    return await this.fetchXivApiGet(`https://xivapi.com/search`, params);
  }

  async fetchElasticSearch(
    pIndexes: string,
    pBody: object,
    pColumn = 'ID,Name,IconHD',
  ) {
    const data: any = {
      indexes: pIndexes,
      body: pBody,
    };
    if (pColumn.length > 0) data['columns'] = pColumn;
    return await this.fetchXivApiPost(`https://xivapi.com/search`, data);
  }

  async fetchItem(pId: number, pLimit = '100') {
    const params = {
      limit: pLimit,
    };
    return await this.fetchXivApiGet(`https://xivapi.com/item/${pId}`, params);
  }

  async fetchInstance(pId: number, pLimit = '100') {
    const params = {
      limit: pLimit,
    };
    return await this.fetchXivApiGet(
      `https://xivapi.com/instancecontent/${pId}`,
      params,
    );
  }

  private async fetchXivApiGet(pUrl: string, pData: object) {
    return await axios.get(`${pUrl}`, {
      params: {
        ...pData,
        private_key: this.configService.get('XIVAPI_KEY'),
      },
    });
  }

  private async fetchXivApiPost(pUrl: string, pData: object) {
    return await axios.post(`${pUrl}`, {
      ...pData,
      private_key: this.configService.get('XIVAPI_KEY'),
    });
  }
}
