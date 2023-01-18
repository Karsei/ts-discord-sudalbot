import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';

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
        entities: ['dist/**/*.entity.{ts,js}'],
        synchronize: 'prod' !== process.env.NODE_ENV,
    }),
    inject: [ ConfigService ],
};
