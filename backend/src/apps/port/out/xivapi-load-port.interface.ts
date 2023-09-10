import { AxiosResponse } from 'axios';

export interface XivApiLoadPort {
  fetchElasticSearch(
    pIndexes: string,
    pBody: object,
    pColumn?: string,
  ): Promise<AxiosResponse<any, any>>;
  fetchItem(pId: number, pLimit?: string): Promise<AxiosResponse<any, any>>;
}

export const XivApiLoadPortToken = Symbol('XivApiLoadPort');
