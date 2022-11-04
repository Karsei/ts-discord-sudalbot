import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';

import { News } from '../entities/news.entity';
import { Guild } from '../entities/guild.entity';
import { Contact } from '../entities/contact.entity';

export const TypeORMConfig: TypeOrmModuleAsyncOptions = {
    imports: [ ConfigModule ],
    useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('MARIADB_HOST'),
        port: configService.get('MARIADB_PORT'),
        username: configService.get('MARIADB_USER'),
        password: configService.get('MARIADB_PASSWORD'),
        database: configService.get('MARIADB_DATABASE'),
        //entities: ['../**/*.entity.{ts,js}'],
        entities: [Guild, News, Contact],
        synchronize: 'prod' !== process.env.NODE_ENV,
    }),
    inject: [ ConfigService ],
};
