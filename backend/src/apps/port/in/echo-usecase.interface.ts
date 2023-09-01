export interface EchoUseCase {
  echo(message: string): string;
}

export const EchoUseCaseToken = Symbol('EchoUseCase');
