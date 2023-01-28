import { DiscordAPIError, SelectMenuInteraction } from 'discord.js';
import { Inject, Logger, LoggerService } from '@nestjs/common';
import { InteractionEventCollector, On, Once } from '@discord-nestjs/core';

import { ItemSearchService } from './item-search.service';
import { ItemSearchInteractionService } from './item-search-interaction.service';

@InteractionEventCollector({
  time: ItemSearchInteractionService.MAX_COMPONENT_TIMEOUT,
  maxComponents: 30,
})
export class ItemSearchInteractionPostCollector {
  constructor(
    @Inject(Logger) private readonly loggerService: LoggerService,
    private readonly itemSearchService: ItemSearchService,
    private readonly itemSearchInteractionService: ItemSearchInteractionService,
  ) {}

  @On('collect')
  async onCollect(interaction: SelectMenuInteraction): Promise<void> {
    try {
      if (!interaction.deferred && !interaction.replied) {
        try {
          await interaction.deferUpdate();
        } catch (error) {
          if (error instanceof DiscordAPIError) {
            // ignore
          } else {
            throw error;
          }
        }
      }

      const values = interaction.values[0].split('||');
      const keyword = values[0],
        secondaryValue = values[1];

      await interaction.editReply({
        content: '잠시만 기다려주세요...!',
        embeds: [],
        components: [],
      });

      const primaryValues = secondaryValue.split(
        ItemSearchInteractionService.MENU_PAGE_VALUE,
      );
      const page = primaryValues.length > 1 ? parseInt(primaryValues[1]) : 0,
        itemId = primaryValues.length == 1 ? parseInt(primaryValues[0]) : 0;

      if (page > 0) {
        const searchResults = await this.itemSearchService.fetchSearchItems(
          keyword,
        );
        await this.itemSearchInteractionService.list(
          interaction,
          keyword,
          searchResults,
          page,
        );
      } else {
        const info = await this.itemSearchService.fetchSearchItemById(itemId);
        await this.itemSearchInteractionService.info(interaction, info);
      }
    } catch (e) {
      if (e instanceof Error) {
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

  @Once('end')
  onEnd(): void {
    //
  }
}
