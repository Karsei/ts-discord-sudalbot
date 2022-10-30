import { NestFactory } from '@nestjs/core';
import * as winston from 'winston';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';

import { AppModule } from './app.module';

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

  const app = await NestFactory.create(AppModule, {
    logger: logger,
  });
  await app.listen(process.env.SERVER_PORT);

  logger.log(`Current Server Profile: '${process.env.NODE_ENV}'`);
  logger.log(`Listening HTTP Requests on ${process.env.SERVER_PORT}...`);
}
bootstrap();
