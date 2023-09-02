import { ManagedWebhook } from '../../service/fashioncheck/fashioncheck.service';

export interface FashionCheckSavePort {
  setFashionCheckNoticeGuildWebhook(webhook: ManagedWebhook): Promise<number>;

  setFashionCheckTopic(topicId: string): Promise<number>;

  delFashionCheckNoticeWebhook(webhook: ManagedWebhook): Promise<void>;
}

export const FashionCheckSavePortToken = Symbol('FashionCheckSavePort');
