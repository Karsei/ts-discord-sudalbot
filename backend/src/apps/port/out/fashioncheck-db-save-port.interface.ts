import { InsertResult } from 'typeorm';

import { ManagedWebhook } from '../../service/fashioncheck/fashioncheck.service';

export interface FashionCheckDbSavePort {
  setFashionCheckNoticeWebhook(webhook: ManagedWebhook): Promise<InsertResult>;

  delFashionCheckNoticeWebhook(webhook: ManagedWebhook);
}

export const FashionCheckDbSavePortToken = Symbol('FashionCheckDbSavePort');
