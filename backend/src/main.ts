import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as winston from 'winston';
import * as winstonDaily from 'winston-daily-rotate-file';
import { join } from 'path';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';

import { AppModule } from './app.module';

// node 에서 허가되지 않은 인증 TLS 통신을 거부하지 않음
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const dailyOptions = (level: string) => {
  return {
    level,
    datePattern: 'YYYY-MM-DD',
    dirname: './logs',
    filename: `%DATE%.${level}.log`,
    maxFiles: 30,
    zippedArchive: true,
    handleExceptions: true,
  };
};

const logger = WinstonModule.createLogger({
  transports: [
    // 파일 저장 (info)
    new winstonDaily(dailyOptions('info')),
    new winstonDaily(dailyOptions('error')),
    // Console
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

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: logger,
  });
  app.useStaticAssets(join(__dirname, '..', 'views'));
  await app.listen(process.env.SERVER_PORT);

  logger.log(`Current Server Profile: '${process.env.NODE_ENV}'`);
  logger.log(`Listening HTTP Requests on ${process.env.SERVER_PORT}...`);
}
bootstrap();

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});