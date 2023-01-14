import { TransformPipe } from '@discord-nestjs/common';
import {
    Command,
    DiscordTransformedCommand,
    Payload,
    TransformedCommandExecutionContext,
    UsePipes,
} from '@discord-nestjs/core';

import { ChatGptService } from './chatgpt.service';
import { ChatGptDto } from '../../dtos/chatgpt.dto';

@Command({
    name: '대화하기',
    description: 'GPT-3 모델을 이용하여 달달이와 대화합니다. (영어로 해야 정확성이 높으며, 응답 시간이 조금 늦을 수 있습니다)',
})
@UsePipes(TransformPipe)
export class ChatGptCommand implements DiscordTransformedCommand<ChatGptDto> {
    constructor(private readonly chatGptService: ChatGptService) {
    }

    async handler(
        @Payload() dto: ChatGptDto,
        { interaction }: TransformedCommandExecutionContext,
    ) {
        await interaction.deferReply();
        const res = await this.chatGptService.converse(interaction.guildId, interaction.user.id, dto.message);
        await interaction.editReply(res);
    }
}
