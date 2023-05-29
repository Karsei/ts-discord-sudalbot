const cron = require('node-cron');
// Service
import NewsWebhookService from './news-webhook.service';

export default class NewsSchedulerService
{
    private readonly newsWebhookService: NewsWebhookService;
    constructor(newsWebhookService: NewsWebhookService) {
        this.newsWebhookService = newsWebhookService;
    }

    run(): void {
        let wCron = cron.schedule('5,15,25,35,45,55 * * * *', async () => {
            await this.newsWebhookService.publishAll();
        }, { timezone: 'Asia/Seoul' });
        let wsCron = cron.schedule('0,10,20,30,40,50 * * * *', async () => {
            await this.newsWebhookService.publishResendAll();
        }, { timezone: 'Asia/Seoul' });

        wCron.start();
        wsCron.start();
    }
}