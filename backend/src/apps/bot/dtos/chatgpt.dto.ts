import { Param } from '@discord-nestjs/core';

export class ChatGptDto {
    @Param({
        name: '메세지',
        description:
            '메세지를 입력하세요.',
        required: true,
    })
    message: string;
}