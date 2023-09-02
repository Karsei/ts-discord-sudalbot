import { ManagedWebhook } from '../../service/fashioncheck/fashioncheck.service';

export interface FashionCheckNoticeUseCase {
  publishAll(): Promise<void>;
  getWebhook(guildId: string): Promise<ManagedWebhook>;
  setWebhook(webhook: ManagedWebhook): Promise<number>;
}

export const FashionCheckNoticeUseCaseToken = Symbol(
  'FashionCheckNoticeUseCase',
);
