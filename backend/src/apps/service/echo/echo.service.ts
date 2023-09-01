import { Injectable } from '@nestjs/common';

import { EchoUseCase } from '../../port/in/echo-usecase.interface';

@Injectable()
export class EchoService implements EchoUseCase {
  echo = (message: string) => message;
}
