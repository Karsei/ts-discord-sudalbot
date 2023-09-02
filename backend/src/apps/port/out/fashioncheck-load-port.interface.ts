import { ManagedWebhook } from '../../service/fashioncheck/fashioncheck.service';

export interface FashionCheckLoadPort {
  getFashionCheckNoticeWebhookGuildIds(): Promise<string[]>;

  getFashionCheckGuildNoticeWebhook(guildId: string): Promise<ManagedWebhook>;

  isExistFashionCheckTopic(topicId: string): Promise<number>;
}

export const FashionCheckLoadPortToken = Symbol('FashionCheckLoadPort');
