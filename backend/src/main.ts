import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

import { AppModule } from './app.module';

// node 에서 허가되지 않은 인증 TLS 통신을 거부하지 않음
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {});
  app.useStaticAssets(join(__dirname, '..', 'views'));
  await app.listen(process.env.SERVER_PORT);
  console.log(
    `Current Server Profile: '${process.env.NODE_ENV}', Listening HTTP Requests on ${process.env.SERVER_PORT}...`,
  );
}
bootstrap();

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});
