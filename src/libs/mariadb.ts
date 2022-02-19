const mariadb = require('mariadb');
const Logger = require('../libs/logger');
// Config
import Setting from '../shared/setting';

export default class MariaDbConnection {
    private static dbPool: any;
    private static dbCon: any;
    public static async init() {
        try {
            this.dbPool = mariadb.createPool({
                host: Setting.MARIADB_HOST,
                database: Setting.MARIADB_DATABASE,
                user: Setting.MARIADB_USER,
                password: Setting.MARIADB_PASSWORD,
                port: Setting.MARIADB_PORT,
                connectionLimit: Setting.MARIADB_CONNECTION_LIMIT,
                connectTimeout: 5000,
                acquireTimeout: 5000,
                idleTimeout: 0,
            });

            this.dbCon = await this.dbPool.getConnection();
        }
        catch (e) {
            Logger.error('DB 연결 오류가 발생했습니다.', e);
        }
    }

    public static instance(): any {
        return this.dbCon;
    }
}