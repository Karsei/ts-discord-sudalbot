import {createClient as RedisCreateClient} from "redis";
const Logger = require('../libs/logger');
// Config
import Setting from '../shared/setting';

export default class RedisConnection {
    private static redisCon: any;
    public static async init() {
        this.redisCon = RedisCreateClient({
            socket: {
                host: Setting.REDIS_HOST,
                port: Setting.REDIS_PORT
            },
            database: Setting.REDIS_DB,
            password: Setting.REDIS_PASSWORD
        });

        await this.redisCon.on('error', (err: any) => {
            Logger.error('Redis 오류가 발생했습니다.', err);
        });
        await this.redisCon.connect();
    }

    public static instance(): any {
        return this.redisCon;
    }
}