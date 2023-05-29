const mariadb = require('mariadb');
// Config
import Setting from '../definition/setting';

export default class MariaDbConnection {
    private static dbPool: any;
    private static dbCon: any;
    public static async init() {
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

    public static instance(): any {
        return this.dbCon;
    }
}