export interface UptimeUseCase {
  fetchTime(): void;
}

export const UptimeUseCaseToken = Symbol('UptimeUseCase');
