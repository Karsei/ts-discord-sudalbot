import { Controller, Get, Query, Res, Logger, LoggerService, Inject } from '@nestjs/common';

import { WebhookService } from './webhook.service';
import { SaveWebhookDto } from './dto/save-webhook.dto';

@Controller('/webhook')
export class WebhookController {
    constructor(@Inject(Logger) private readonly loggerService: LoggerService,
                private readonly webhookService: WebhookService) {}

    @Get('/save')
    async save(@Query() param: SaveWebhookDto,
               @Res() res) {
        try {
            await this.webhookService.subscribe(param);
            res.send(`<script>alert('봇이 추가되었습니다. 디스코드를 확인하세요.'); window.location.href = '/';</script>`);
        }
        catch (e) {
            this.loggerService.error(e);
            console.error(e);
            res.send(`<script>alert('봇을 추가하는 과정에서 오류가 발생했습니다.'); window.location.href = '/';</script>`);
        }
    }

    @Get('/save-done')
    async done(@Res() res) {
        console.log('yeah');
        return '완료';
    }
}
