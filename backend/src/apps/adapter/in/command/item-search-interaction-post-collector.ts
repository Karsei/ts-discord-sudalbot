import { DiscordAPIError, Message, SelectMenuInteraction } from 'discord.js';
import {
  Inject,
  Injectable,
  Logger,
  LoggerService,
  Scope,
} from '@nestjs/common';
import { InteractionEventCollector, On, Once } from '@discord-nestjs/core';

import { ItemSearchInteractionService } from '../../../service/item/item-search-interaction.service';
import {
  ItemSearchUseCase,
  ItemSearchUseCaseToken,
} from '../../../port/in/item-search-usecase.interface';
import {
  ItemSearchInteractionUseCase,
  ItemSearchInteractionUseCaseToken,
} from '../../../port/in/item-search-interaction-usecase.interface';

@Injectable({ scope: Scope.REQUEST })
@InteractionEventCollector({
  time: ItemSearchInteractionService.MAX_COMPONENT_TIMEOUT,
  maxComponents: 30,
})
export class ItemSearchInteractionPostCollector {
  constructor(
    @Inject(Logger)
    private readonly loggerService: LoggerService,
    @Inject(ItemSearchUseCaseToken)
    private readonly itemSearchService: ItemSearchUseCase,
    @Inject(ItemSearchInteractionUseCaseToken)
    private readonly itemSearchInteractionService: ItemSearchInteractionUseCase,
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
          {
            page,
            perPage: ItemSearchInteractionService.MAX_NUMBER_VIEW_ON_SELECT,
          },
        );
        const { embedMsg, component } = this.itemSearchInteractionService.list(
          keyword,
          searchResults,
          {
            page,
            perPage: ItemSearchInteractionService.MAX_NUMBER_VIEW_ON_SELECT,
          },
        );

        await interaction.editReply({
          content: '',
          embeds: [embedMsg],
          components: [component],
        });

        setTimeout(async () => {
          const fetchMsg = await interaction.fetchReply();
          if (!(fetchMsg instanceof Message)) return;
          if (fetchMsg.components.length == 0) return;

          await interaction.editReply({
            content: '시간이 꽤 지나서 다시 명령어를 이용해주세요.',
            embeds: [],
            components: [],
          });
        }, ItemSearchInteractionService.MAX_COMPONENT_TIMEOUT);
      } else {
        const info = await this.itemSearchService.fetchSearchItemById(itemId);
        const { embedMsg } = await this.itemSearchInteractionService.info(info);
        await interaction.editReply({
          content: '',
          embeds: [embedMsg],
          components: [],
        });
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
