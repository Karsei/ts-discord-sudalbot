import { NestFactory } from '@nestjs/core';
import * as winston from 'winston';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
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
    }),
  });
  await app.listen(process.env.SERVER_PORT);
  console.info(`Current Server Profile: '${process.env.NODE_ENV}'`);
  console.info(`Listening HTTP Requests on ${process.env.SERVER_PORT}...`);
}
bootstrap();
