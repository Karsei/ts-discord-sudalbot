const cron = require('node-cron');
import MariaDbConnection from '../lib/mariadb';

class ConnectionSchedulerService
{
    run(): void {
        let cCron = cron.schedule('* * * * *', async () => {
            MariaDbConnection.instance().query(`SELECT 1`);
        }, { timezone: 'Asia/Seoul' });

        cCron.start();
    }
}

module.exports = ConnectionSchedulerService;