import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';

import { News } from '../entities/news.entity';
import { Guild } from '../entities/guild.entity';
import { Contact } from '../entities/contact.entity';
import { XivVersion } from '../entities/xiv-version.entity';
import { XivItem } from '../entities/xiv-item.entity';
import { XivItemCategories } from '../entities/xiv-item-categories.entity';
import { Chat } from "../entities/chat.entity";

export const TypeORMConfig: TypeOrmModuleAsyncOptions = {
    imports: [ ConfigModule ],
    useFactory: (configService: ConfigService) => ({
        timezone: 'Asia/Seoul',
        type: 'mysql',
        host: configService.get('MARIADB_HOST'),
        port: configService.get('MARIADB_PORT'),
        username: configService.get('MARIADB_USER'),
        password: configService.get('MARIADB_PASSWORD'),
        database: configService.get('MARIADB_DATABASE'),
        //entities: ['../**/*.entity.{ts,js}'],
        entities: [Guild, News, Contact, XivVersion, XivItem, XivItemCategories, Chat],
        synchronize: 'prod' !== process.env.NODE_ENV,
    }),
    inject: [ ConfigService ],
};
