import NewsWebhookService from "./NewsWebhookService";

const cron = require('node-cron');

class NewsSchedulerService
{
    run(): void {
        let wCron = cron.schedule('5,15,25,35,45,55 * * * *', async () => {
            await NewsWebhookService.publishAll();
        }, { timezone: 'Asia/Seoul' });
        let wsCron = cron.schedule('0,10,20,30,40,50 * * * *', async () => {
            await NewsWebhookService.publishResendAll();
        }, { timezone: 'Asia/Seoul' });

        wCron.start();
        wsCron.start();
    }
}

module.exports = NewsSchedulerService;