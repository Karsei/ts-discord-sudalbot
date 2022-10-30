import {
    Command,
    DiscordTransformedCommand,
    Payload,
    TransformedCommandExecutionContext,
} from '@discord-nestjs/core';

import {EchoService} from './echo.service';
import {EchoDto} from '../../dtos/echo.dto';

@Command({
    name: '따라하기',
    description: '봇이 사용자의 말을 똑같이 따라합니다.',
})
export class EchoCommand implements DiscordTransformedCommand<EchoDto> {
    constructor(private readonly echoService: EchoService) {
    }

    handler(
        @Payload() dto: EchoDto,
        { interaction }: TransformedCommandExecutionContext,
    ): string {
        return this.echoService.getEcho(dto.message);
    }
}
