import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  ContextMenuCommandInteraction,
  EmbedBuilder,
  Message,
  SelectMenuBuilder,
  SelectMenuInteraction,
} from 'discord.js';
import { AggregatedItemInfo } from '../../../../definitions/xivitem.type';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ItemSearchList } from './item-search.service';
import { GuideFetchHelper } from './guide-fetch.helper';

@Injectable()
export class ItemSearchInteractionService {
  public static readonly MENU_PAGE_VALUE = 'item-search-page-';
  public static readonly MAX_COMPONENT_TIMEOUT = 30000; // ms
  private static readonly MENU_COMPONENT_ID = 'item-search';
  private static readonly MAX_NUMBER_VIEW_ON_SELECT = 10;

  constructor(private readonly configService: ConfigService) {}

  async list(
    interaction:
      | ChatInputCommandInteraction
      | ContextMenuCommandInteraction
      | SelectMenuInteraction,
    keyword: string,
    searchResults: ItemSearchList,
    page: number,
  ) {
    const itmStart =
        (page - 1) * ItemSearchInteractionService.MAX_NUMBER_VIEW_ON_SELECT,
      itmEnd = page * ItemSearchInteractionService.MAX_NUMBER_VIEW_ON_SELECT,
      isNext = itmEnd < searchResults.data.length,
      isPrev = page > 1;

    const itemList: { label: string; value: any }[] = [];
    for (
      let itmIdx = itmStart,
        itmLen =
          itmEnd < searchResults.data.length
            ? itmEnd
            : searchResults.data.length;
      itmIdx < itmLen;
      itmIdx++
    ) {
      itemList.push({
        label: `${itmIdx + 1}. ${searchResults.data[itmIdx].Name}`,
        value: `${keyword}||${searchResults.data[itmIdx].ID}`,
      });
    }

    const embedMsg = this.makeItemRemainListInfoEmbedMessage(
      keyword,
      searchResults.pagination,
      itemList.map((e) => e.label).join('\n'),
    );
    if (isPrev)
      itemList.unshift({
        label: '...이전',
        value: `${keyword}||${ItemSearchInteractionService.MENU_PAGE_VALUE}${
          page - 1
        }`,
      });
    if (isNext)
      itemList.push({
        label: '...다음',
        value: `${keyword}||${ItemSearchInteractionService.MENU_PAGE_VALUE}${
          page + 1
        }`,
      });
    const component = this.makeSelectComponent(itemList);

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

  async info(
    interaction:
      | ChatInputCommandInteraction
      | ContextMenuCommandInteraction
      | SelectMenuInteraction,
    info: AggregatedItemInfo,
  ) {
    const dbLinks = await this.getDbSiteLinks(info),
      embedMsg = this.makeItemInfoEmbedMessage(info, dbLinks);

    await interaction.editReply({
      content: '',
      embeds: [embedMsg],
      components: [],
    });
  }

  private makeSelectComponent(items: { label: string; value: any }[]) {
    return new ActionRowBuilder<SelectMenuBuilder>().addComponents(
      new SelectMenuBuilder()
        .setCustomId(ItemSearchInteractionService.MENU_COMPONENT_ID)
        .setPlaceholder('선택해주세요')
        .addOptions(items),
    );
  }

  private makeItemRemainListInfoEmbedMessage(
    keyword: string,
    pagination: { ResultsTotal: number },
    itmListStr: string,
  ) {
    return new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`아이템 검색`)
      .setDescription(`여러 개의 아이템이 검색되었습니다. 아래에서 선택하세요.`)
      .addFields({
        name: `"${keyword}" 검색 결과 (총 ${pagination.ResultsTotal}개)`,
        value: itmListStr,
      })
      .setTimestamp(new Date())
      .setFooter({
        text: this.configService.get('APP_NAME'),
      });
  }

  private async getDbSiteLinks(filtered: AggregatedItemInfo) {
    let koreaDbLink = '';
    try {
      koreaDbLink = await GuideFetchHelper.searchItemUrl(filtered.nameKr);
    } catch (ee) {
      console.error(ee);
    }

    return (
      `[FF14 글로벌 공식 DB](https://na.finalfantasyxiv.com/lodestone/playguide/db/search/?q=${filtered.nameEn.replace(
        / /gm,
        '+',
      )})` +
      (koreaDbLink != '' ? `\n[FF14 한국 공식 DB](${koreaDbLink})` : '') +
      `\n[Garland Tools](https://www.garlandtools.org/db/#item/${filtered.id})` +
      `\n[Teamcraft](https://ffxivteamcraft.com/db/ko/item/${filtered.id})` +
      `\n[XIVAPI](https://xivapi.com/item/${filtered.id})` +
      `\n[타르토맛 타르트](https://ff14.tar.to/item/view/${filtered.id})` +
      `\n[Project Anyder](https://anyder.vercel.app/item/${filtered.id})` +
      `\n[Gamerescape](https://ffxiv.gamerescape.com/wiki/${filtered.nameEn.replace(
        / /gm,
        '_',
      )})` +
      `\n[Web Model Viewer](https://ffxiv.dlunch.net/model?itemId=${filtered.id}&language=7)` +
      `\n[FF14 인벤](https://ff14.inven.co.kr/dataninfo/item/detail.php?code=${filtered.id})`
    );
  }

  private makeItemInfoEmbedMessage(
    filtered: AggregatedItemInfo,
    dbLinks: string,
  ) {
    return new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(
        filtered.nameKr
          ? filtered.nameKr
          : filtered.name
          ? filtered.name
          : null,
      )
      .setDescription(
        filtered.descKr
          ? filtered.descKr
          : filtered.desc
          ? filtered.desc
          : null,
      )
      .addFields(
        {
          name: `아이템 이름`,
          value: `:flag_us: ${filtered.nameEn}\n:flag_jp: ${
            filtered.nameJa
          }\n:flag_kr: ${
            filtered.nameKr ? filtered.nameKr : '(알 수 없음)'
          }\n:flag_de: ${filtered.nameDe}\n:flag_fr: ${filtered.nameFr}`,
        },
        { name: `아이템 레벨`, value: `${filtered.itemLevel}`, inline: true },
        {
          name: `출시 버전`,
          value: filtered.gamePatchVersion,
          inline: true,
        },
        { name: `고유번호`, value: `${filtered.id}`, inline: true },
        { name: `종류`, value: filtered.itemUiCategoryName, inline: true },
        {
          name: `아이템 분해`,
          value: filtered.desynth === 0 ? '불가' : '가능',
          inline: true,
        },
        {
          name: `아이템 정제`,
          value: filtered.isCollectable === 0 ? '불가' : '가능',
          inline: true,
        },
        { name: `DB 링크`, value: dbLinks },
      )
      .setThumbnail(`https://xivapi.com${filtered.itemIcon}`)
      .setTimestamp()
      .setFooter({
        text: this.configService.get('APP_NAME'),
      });
  }
}
