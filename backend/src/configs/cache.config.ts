import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModuleAsyncOptions } from '@liaoliaots/nestjs-redis';

export const CacheConfig: RedisModuleAsyncOptions = {
    imports: [ ConfigModule ],
    useFactory: (configService: ConfigService) => ({
        config: {
            host: configService.get('REDIS_HOST'),
            port: configService.get('REDIS_PORT'),
            password: configService.get('REDIS_PASSWORD'),
            db: configService.get('REDIS_DB'),
        }
    }),
    inject: [ ConfigService ],
};
