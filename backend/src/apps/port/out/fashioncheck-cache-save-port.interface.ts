import { ManagedWebhook } from '../../service/fashioncheck/fashioncheck.service';

export interface FashionCheckCacheSavePort {
  setFashionCheckNoticeWebhook(webhook: ManagedWebhook): Promise<number>;

  delFashionCheckNoticeWebhook(webhook: ManagedWebhook): Promise<number>;

  setFashionCheckTopic(topicId: string): Promise<number>;
}

export const FashionCheckCacheSavePortToken = Symbol(
  'FashionCheckCacheSavePort',
);
