export interface NewsPublishUseCase {
  publishAll(): void;
  publishResendAll(): void;
}

export const NewsPublishUseCaseToken = Symbol('NewsPublishUseCase');
