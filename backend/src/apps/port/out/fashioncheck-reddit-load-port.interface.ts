import { Submission } from 'snoowrap';

export interface FashionCheckRedditLoadPort {
  loadFashion(): Promise<Submission>;
}

// https://github.com/nestjs/nest/issues/43#issuecomment-300092490
export const FashionCheckRedditLoadPortToken = Symbol(
  'FashionCheckRedditLoadPort',
);
