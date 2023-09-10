export interface ItemStoreUseCase {
  init(): Promise<void>;
}

export const ItemStoreUseCaseToken = Symbol('ItemStoreUseCase');
