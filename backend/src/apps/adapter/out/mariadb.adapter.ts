import { InsertResult, IsNull, Like, Repository } from 'typeorm';
import { ModalSubmitInteraction } from 'discord.js';
import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Contact } from '../../../entities/contact.entity';
import { ContactCommand } from '../in/command/contact.command';
import { ContactSavePort } from '../../port/out/contact-save-port.interface';
import { FashionCheckDbSavePort } from '../../port/out/fashioncheck-db-save-port.interface';
import { ManagedWebhook } from '../../service/fashioncheck/fashioncheck.service';
import { FashionCheckNotice } from '../../../entities/fashioncheck-notice.entity';
import { FashionCheckDbLoadPort } from '../../port/out/fashioncheck-db-load-port.interface';
import { XivVersion } from '../../../entities/xiv-version.entity';
import { XivItem } from '../../../entities/xiv-item.entity';
import { XivItemCategories } from '../../../entities/xiv-item-categories.entity';
import {
  ClientFileLoadPort,
  ClientFileLoadPortToken,
} from '../../port/out/client-file-load-port.interface';
import { ItemStoreSavePort } from '../../port/out/itemstore-save-port.interface';
import { ItemStoreLoadPort } from '../../port/out/itemstore-load-port.interface';
import { PaginationParams } from '../../../definitions/interface/archive';
import { NewsPublishDbSavePort } from '../../port/out/news-publish-db-save-port.interface';
import { News } from '../../../entities/news.entity';

const cliProgress = require('cli-progress');

@Injectable()
export class MariadbAdapter
  implements
    ContactSavePort,
    FashionCheckDbLoadPort,
    FashionCheckDbSavePort,
    ItemStoreLoadPort,
    ItemStoreSavePort,
    NewsPublishDbSavePort
{
  constructor(
    @Inject(Logger)
    private readonly loggerService: LoggerService,

    // # CONTACT
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,

    // # FASHION
    @InjectRepository(FashionCheckNotice)
    private readonly fashionCheckRepository: Repository<FashionCheckNotice>,

    // # ITEMSTORE
    @InjectRepository(XivVersion)
    private readonly xivVersionRepository: Repository<XivVersion>,
    @InjectRepository(XivItem)
    private readonly xivItemRepository: Repository<XivItem>,
    @InjectRepository(XivItemCategories)
    private readonly xivItemCategoriesRepository: Repository<XivItemCategories>,

    // # NEWS
    @InjectRepository(News)
    private newsRepository: Repository<News>,

    // # GITHUB
    @Inject(ClientFileLoadPortToken)
    private readonly clientFileLoadPort: ClientFileLoadPort,
  ) {}

  /**
   * 제보 저장
   * @param modal modal 제출 상호작용
   */
  async saveContact(modal: ModalSubmitInteraction): Promise<InsertResult> {
    return this.contactRepository.insert({
      guild: { id: modal.guildId },
      userId: modal.user.id,
      userName: modal.user.username,
      summary: modal.fields.fields.get(ContactCommand.SUMMARY_COMPONENT_ID)
        .value,
      comment: modal.fields.fields.get(ContactCommand.COMMENT_COMPONENT_ID)
        .value,
    });
  }

  async getFashionCheckNoticeWebhookGuildIds() {
    const guildIds: string[] = [];
    const guilds = await this.fashionCheckRepository.find({
      where: {
        deletedAt: IsNull(),
      },
    });
    if (guilds != null) {
      for (const guildObj of guilds) {
        guildIds.push(guildObj.guild.id);
      }
    }
    return guildIds;
  }

  async getFashionCheckNoticeWebhook(guildId: string): Promise<ManagedWebhook> {
    const db = await this.fashionCheckRepository.findOneBy({
      guild: { id: guildId },
    });
    if (db != null)
      return {
        guildId: guildId,
        channelId: db.webhookChannelId,
        webhookId: db.webhookId,
        webhookToken: db.webhookToken,
      };
    return null;
  }

  async setFashionCheckNoticeWebhook(webhook: ManagedWebhook) {
    await this.fashionCheckRepository.delete(webhook.guildId);
    return await this.fashionCheckRepository.insert({
      guild: { id: webhook.guildId },
      webhookId: webhook.webhookId,
      webhookToken: webhook.webhookToken,
      webhookChannelId: webhook.channelId,
    });
  }

  async delFashionCheckNoticeWebhook(webhook: ManagedWebhook) {
    return this.fashionCheckRepository.delete(webhook.guildId);
  }

  async getLatestKoreanVersionFromDB() {
    return this.xivVersionRepository.findOne({
      where: [{ locale: 'kr' }],
      order: { version: 'DESC' },
    });
  }

  async extracted(latestVersionRemote: number, latestVersionDb: XivVersion) {
    await this.xivVersionRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // 새로운 버전 데이터 저장
        const xivVersion = new XivVersion();
        xivVersion.version = latestVersionRemote;
        xivVersion.locale = 'kr';
        await transactionalEntityManager.save(xivVersion);

        // 아이템 데이터 저장
        this.loggerService.log('Fetching Item...');
        const itemRes = await this.clientFileLoadPort.fetch('Item');
        const bItem = new cliProgress.Bar();
        bItem.start(itemRes.length, 0);
        for (
          let dataIdx = 0, dataTotal = itemRes.length;
          dataIdx < dataTotal;
          dataIdx++
        ) {
          const csvItem = itemRes[dataIdx];
          if (csvItem.hasOwnProperty('_')) delete csvItem['_'];

          await transactionalEntityManager.insert(XivItem, {
            version: { idx: xivVersion.idx },
            itemIdx: csvItem['#'],
            name: csvItem['Name'],
            content: JSON.stringify(csvItem),
          });
          bItem.increment();
        }
        bItem.stop();

        // 아이템 카테고리 데이터 저장
        // ItemUiCategory
        this.loggerService.log('Fetching ItemUICategory...');
        const itemUiCategoryRes = await this.clientFileLoadPort.fetch(
          'ItemUICategory',
        );
        const bItemUiCategory = new cliProgress.Bar();
        bItemUiCategory.start(itemUiCategoryRes.length, 0);
        for (
          let dataIdx = 0, dataTotal = itemUiCategoryRes.length;
          dataIdx < dataTotal;
          dataIdx++
        ) {
          const csvItem = itemUiCategoryRes[dataIdx];
          if (csvItem.hasOwnProperty('_')) delete csvItem['_'];

          await transactionalEntityManager.insert(XivItemCategories, {
            version: { idx: xivVersion.idx },
            itemCategoryIdx: csvItem['#'],
            name: csvItem['Name'],
            content: JSON.stringify(csvItem),
          });
          bItemUiCategory.increment();
        }
        bItemUiCategory.stop();

        // 이전 데이터는 삭제 처리
        if (latestVersionDb) {
          await transactionalEntityManager.softDelete(XivVersion, {
            idx: latestVersionDb.idx,
          });
        }
      },
    );
  }

  async getItemCategoriesByIdx(locale: string, idx: number) {
    return await this.xivItemCategoriesRepository.find({
      where: {
        version: { locale: locale },
        itemCategoryIdx: idx,
      },
      order: { version: { version: 'DESC' } },
    });
  }

  async getItemsByIdx(locale: string, idx: number) {
    return await this.xivItemRepository.find({
      where: {
        version: { locale: locale },
        itemIdx: idx,
      },
      order: { version: { version: 'DESC' } },
    });
  }

  async getItemsByName(
    locale: string,
    name: string,
    paginationParams: PaginationParams,
  ) {
    return await this.xivItemRepository.findAndCount({
      where: {
        version: { locale: locale },
        name: Like(`%${name}%`),
      },
      take: paginationParams.perPage,
      skip: (paginationParams.page - 1) * paginationParams.perPage,
    });
  }

  /**
   * 게시글별 Webhook URL Cache 등록
   *
   * @param guildId 서버 ID
   * @param locale 언어
   * @param type 카테고리
   * @param url Webhook URL
   */
  async addNewsWebhookUrl(
    guildId: string,
    locale: string,
    type: string,
    url: string,
  ) {
    return this.newsRepository.insert({
      guild: { id: guildId },
      locale: locale,
      type: type,
      url: url,
    });
  }

  /**
   * 게시글별 Webhook URL Cache 삭제
   *
   * @param guildId 서버 ID
   * @param locale 언어
   * @param type 카테고리
   */
  async delNewsWebhookUrl(guildId: string, locale: string, type: string) {
    return this.newsRepository.delete({
      guild: { id: guildId },
      locale: locale,
      type: type,
    });
  }
}
