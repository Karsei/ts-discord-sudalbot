import axios, { AxiosResponse } from 'axios';
import { Injectable } from '@nestjs/common';

import { UniversalisLoadPort } from '../../port/out/universalis-load-port.interface';

export interface SearchResult {
  itemID: number;
  lastUploadTime: number;
  listings: SearchResultDetail[];
  recentHistory: SearchResultHistory[];
  dcName: string;
  currentAveragePrice: number;
  currentAveragePriceNQ: number;
  currentAveragePriceHQ: number;
  regularSaleVelocity: number;
  nqSaleVelocity: number;
  hqSaleVelocity: number;
  averagePrice: number;
  averagePriceNQ: number;
  averagePriceHQ: number;
  minPrice: number;
  minPriceNQ: number;
  minPriceHQ: number;
  maxPrice: number;
  maxPriceNQ: number;
  maxPriceHQ: number;
  stackSizeHistogram: { [index: string]: number };
  stackSizeHistogramNQ: { [index: string]: number };
  stackSizeHistogramHQ: { [index: string]: number };
  worldUploadTimes: { [index: string]: number };
  listingsCount: number;
  recentHistoryCount: number;
  unitsForSale: number;
  unitsSold: number;
}

export interface SearchResultHistory {
  hq: boolean;
  pricePerUnit: number;
  quantity: number;
  timestamp: number;
  onMannequin: boolean;
  worldName: string;
  worldID: number;
  buyerName: string;
  total: number;
}

export interface SearchResultDetail {
  lastReviewTime: number;
  pricePerUnit: number;
  quantity: number;
  stainID: number;
  worldName: string;
  worldID: number;
  creatorName: string;
  creatorID?: string;
  hq: boolean;
  isCrafted: boolean;
  listingID: string;
  materia: any[];
  onMannequin: boolean;
  retainerCity: number;
  retainerID: string;
  retainerName: string;
  sellerID: string;
  total: number;
}

@Injectable()
export class UniversalisAdapter implements UniversalisLoadPort {
  constructor() {
    // nothing
  }

  async fetchCurrentList(
    server: string,
    itemId: number,
  ): Promise<AxiosResponse<SearchResult, SearchResult>> {
    return axios.get(`https://universalis.app/api/${server}/${itemId}`);
  }
}
