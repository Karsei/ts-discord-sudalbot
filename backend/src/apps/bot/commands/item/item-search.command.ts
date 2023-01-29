import { Inject, Logger, LoggerService } from '@nestjs/common';
import { TransformPipe } from '@discord-nestjs/common';
import {
  Command,
  DiscordTransformedCommand,
  Payload,
  TransformedCommandExecutionContext,
  UseCollectors,
  UsePipes,
} from '@discord-nestjs/core';

import { ItemSearchService } from './item-search.service';
import { ItemSearchDto } from '../../dtos/itemsearch.dto';
import { ItemSearchError } from '../../../../exceptions/item-search.exception';
import { ConfigService } from '@nestjs/config';
import { ItemSearchInteractionService } from './item-search-interaction.service';
import { ItemSearchInteractionPostCollector } from './item-search-interaction-post-collector';

@Command({
  name: '아이템검색',
  description: '아이템을 검색합니다.',
})
@UsePipes(TransformPipe)
@UseCollectors(ItemSearchInteractionPostCollector)
export class ItemSearchCommand
  implements DiscordTransformedCommand<ItemSearchDto>
{
  constructor(
    private readonly configService: ConfigService,
    @Inject(Logger) private readonly loggerService: LoggerService,
    private readonly itemSearchService: ItemSearchService,
    private readonly itemSearchInteractionService: ItemSearchInteractionService,
  ) {}

  async handler(
    @Payload() dto: ItemSearchDto,
    { interaction }: TransformedCommandExecutionContext,
  ): Promise<void> {
    await interaction.deferReply();

    try {
      const searchPagination = {
        page: 1,
        perPage: ItemSearchInteractionService.MAX_NUMBER_VIEW_ON_SELECT,
      };
      const searchResults = await this.itemSearchService.fetchSearchItems(
        dto.keyword,
        searchPagination,
      );
      if (searchResults.data.length == 1) {
        const info = await this.itemSearchService.fetchSearchItemById(
          searchResults.data[0].ID,
        );
        await this.itemSearchInteractionService.info(interaction, info);
      } else if (searchResults.data.length > 1) {
        await this.itemSearchInteractionService.list(
          interaction,
          dto.keyword,
          searchResults,
          searchPagination,
        );
      }
    } catch (e) {
      if (e instanceof ItemSearchError) {
        await interaction.editReply(e.message);
      } else if (e instanceof Error) {
        await interaction.editReply(
          '오류가 발생해서 보여드릴 수 없네요.. 잠시 후에 다시 시도해보세요.',
        );
        this.loggerService.error(e.stack);
        console.error(e);
      } else {
        this.loggerService.error(e);
        console.error(e);
      }
    }
  }
}
