import { ClientEvents, Message, PermissionsBitField } from 'discord.js';
import { CollectorInterceptor, SlashCommandPipe } from '@discord-nestjs/common';
import { Inject, Logger, LoggerService, UseInterceptors } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Command,
  EventParams,
  Handler,
  IA,
  UseCollectors,
} from '@discord-nestjs/core';

import { ItemSearchInteractionService } from '../../../service/item/item-search-interaction.service';
import { ItemSearchInteractionPostCollector } from './item-search-interaction-post-collector';
import { ItemSearchDto } from '../../../dto/itemsearch.dto';
import { ItemSearchError } from '../../../../exceptions/item-search.exception';
import {
  ItemSearchUseCase,
  ItemSearchUseCaseToken,
} from '../../../port/in/item-search-usecase.interface';
import {
  ItemSearchInteractionUseCase,
  ItemSearchInteractionUseCaseToken,
} from '../../../port/in/item-search-interaction-usecase.interface';

@Command({
  name: '아이템검색',
  description: '아이템을 검색합니다.',
  dmPermission: false,
  defaultMemberPermissions: PermissionsBitField.Flags.ViewChannel,
})
@UseInterceptors(CollectorInterceptor)
@UseCollectors(ItemSearchInteractionPostCollector)
export class ItemSearchCommand {
  constructor(
    private readonly configService: ConfigService,
    @Inject(Logger)
    private readonly loggerService: LoggerService,
    @Inject(ItemSearchUseCaseToken)
    private readonly itemSearchService: ItemSearchUseCase,
    @Inject(ItemSearchInteractionUseCaseToken)
    private readonly itemSearchInteractionService: ItemSearchInteractionUseCase,
  ) {}

  /**
   * 명령어 핸들러
   * @param dto 아이템 검색 파라미터
   * @param args
   */
  @Handler()
  async handler(
    @IA(SlashCommandPipe) dto: ItemSearchDto,
    @EventParams() args: ClientEvents['interactionCreate'],
  ): Promise<void> {
    const [interaction] = args;
    if (!interaction.isChatInputCommand()) return;

    // 응답 대기 전송
    try {
      await interaction.deferReply();
    } catch (e) {
      this.loggerService.error('아이템검색 defer 오류: ', e);
      return;
    }

    try {
      // 목록 검색
      const searchPagination = {
        page: 1,
        perPage: ItemSearchInteractionService.MAX_NUMBER_VIEW_ON_SELECT,
      };
      const searchResults = await this.itemSearchService.fetchSearchItems(
        dto.keyword,
        searchPagination,
      );

      // 검색 결과가 하나일 경우 바로 보여줌
      if (searchResults.data.length == 1) {
        const info = await this.itemSearchService.fetchSearchItemById(
          searchResults.data[0].ID,
        );
        const { embedMsg } = await this.itemSearchInteractionService.info(info);
        await interaction.editReply({
          content: '',
          embeds: [embedMsg],
          components: [],
        });
      }
      // 여러 개일 경우 선택지를 제공함
      else if (searchResults.data.length > 1) {
        const { embedMsg, component } = this.itemSearchInteractionService.list(
          dto.keyword,
          searchResults,
          searchPagination,
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
