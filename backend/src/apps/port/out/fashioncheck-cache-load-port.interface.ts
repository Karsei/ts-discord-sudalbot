import { ManagedWebhook } from '../../service/fashioncheck/fashioncheck.service';

export interface FashionCheckCacheLoadPort {
  getFashionCheckNoticeWebhookGuildIds(): Promise<string[]>;

  getFashionCheckNoticeWebhook(guildId: string): Promise<ManagedWebhook>;

  isExistFashionCheckTopic(topicId: string): Promise<number>;
}

export const FashionCheckCacheLoadPortToken = Symbol(
  'FashionCheckCacheLoadPort',
);
