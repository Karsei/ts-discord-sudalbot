import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as winston from 'winston';
import { join } from 'path';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';

import { AppModule } from './app.module';

// node 에서 허가되지 않은 인증 TLS 통신을 거부하지 않음
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function bootstrap() {
  const logger = WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        level: 'prod' === process.env.NODE_ENV ? 'info' : 'silly',
        format: winston.format.combine(
            winston.format.timestamp(),
            nestWinstonModuleUtilities.format.nestLike(process.env.APP_NAME, {
              prettyPrint: true,
            }),
        ),
      }),
    ],
  });

  process.on('uncaughtException', function(error) {
    logger.error('Unexpected error occurred:', error.message);
    console.error(error);
  });

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: logger,
  });
  app.useStaticAssets(join(__dirname, '..', 'views'));
  await app.listen(process.env.SERVER_PORT);

  logger.log(`Current Server Profile: '${process.env.NODE_ENV}'`);
  logger.log(`Listening HTTP Requests on ${process.env.SERVER_PORT}...`);
}
bootstrap();
