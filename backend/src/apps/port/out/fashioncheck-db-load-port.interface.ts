import { ManagedWebhook } from '../../service/fashioncheck/fashioncheck.service';

export interface FashionCheckDbLoadPort {
  getFashionCheckNoticeWebhookGuildIds(): Promise<string[]>;

  getFashionCheckNoticeWebhook(guildId: string): Promise<ManagedWebhook>;
}

export const FashionCheckDbLoadPortToken = Symbol('FashionCheckDbLoadPort');
