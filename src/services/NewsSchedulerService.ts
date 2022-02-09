const cron = require('node-cron');
// Service
import NewsWebhookService from './NewsWebhookService';

class NewsSchedulerService
{
    private redisCon: any;
    private newsWebhookService: NewsWebhookService;
    constructor(redisCon: any) {
        this.redisCon = redisCon;
        this.newsWebhookService = new NewsWebhookService(redisCon);
    }

    run(): void {
        let wCron = cron.schedule('5,15,25,35,45,55 * * * *', () => {
        }, { timezone: 'Asia/Seoul' });
        let wsCron = cron.schedule('0,10,20,30,40,50 * * * *', () => {
        }, { timezone: 'Asia/Seoul' });

        wCron.start();
        wsCron.start();
    }
}

module.exports = NewsSchedulerService;