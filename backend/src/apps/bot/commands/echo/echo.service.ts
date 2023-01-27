import { Injectable } from '@nestjs/common';

@Injectable()
export class EchoService {
  public getEcho(message: string) {
    return message;
  }
}
