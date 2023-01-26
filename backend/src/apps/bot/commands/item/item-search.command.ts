import { Inject, Logger, LoggerService } from '@nestjs/common';
import { TransformPipe } from '@discord-nestjs/common';
import {
    Command,
    DiscordTransformedCommand,
    Payload,
    TransformedCommandExecutionContext, UsePipes,
} from '@discord-nestjs/core';

import { ItemSearchService } from './item-search.service';
import { ItemSearchDto } from '../../dtos/itemsearch.dto';
import { ItemSearchError } from '../../../../exceptions/item-search.exception';
import {ActionRowBuilder, SelectMenuBuilder} from "discord.js";

@Command({
    name: '아이템검색',
    description: '아이템을 검색합니다.',
})
@UsePipes(TransformPipe)
export class ItemSearchCommand implements DiscordTransformedCommand<ItemSearchDto> {
    private readonly menuComponentId = 'item-search';

    constructor(@Inject(Logger) private readonly loggerService: LoggerService,
                private readonly itemSearchService: ItemSearchService) {
    }

    async handler(
        @Payload() dto: ItemSearchDto,
        { interaction } : TransformedCommandExecutionContext,
    ): Promise<void> {
        await interaction.deferReply();

        try {
            const embedMsg = await this.itemSearchService.search(dto.keyword);

            await interaction.editReply({embeds: [embedMsg]});
        }
        catch (e) {
            if (e instanceof ItemSearchError) {
                await interaction.editReply(e.message);
            }
            else if (e instanceof Error) {
                await interaction.editReply('오류가 발생해서 보여드릴 수 없네요.. 잠시 후에 다시 시도해보세요.');
                this.loggerService.error(e.stack);
                console.error(e);
            }
            else {
                this.loggerService.error(e);
                console.error(e);
            }
        }
    }

    private makeSelectComponent(items: {label: string, value: any}[]) {
        return new ActionRowBuilder<SelectMenuBuilder>()
            .addComponents(
                new SelectMenuBuilder()
                    .setCustomId(this.menuComponentId)
                    .setPlaceholder('선택해주세요')
                    .addOptions(items),
            );
    }
}
