import { AxiosResponse } from 'axios';

import { SearchResult } from '../../adapter/out/universalis.adapter';

export interface UniversalisLoadPort {
  fetchCurrentList(
    server: string,
    itemId: number,
  ): Promise<AxiosResponse<SearchResult, SearchResult>>;
}

// https://github.com/nestjs/nest/issues/43#issuecomment-300092490
export const UniversalisLoadPortToken = Symbol('UniversalisLoadPort');
