import { InsertResult, IsNull, Repository } from 'typeorm';
import { ModalSubmitInteraction } from 'discord.js';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Contact } from '../../../entities/contact.entity';
import { ContactCommand } from '../in/command/contact.command';
import { ContactSavePort } from '../../port/out/contact-save-port.interface';
import { FashionCheckDbSavePort } from '../../port/out/fashioncheck-db-save-port.interface';
import { ManagedWebhook } from '../../service/fashioncheck/fashioncheck.service';
import { FashionCheckNotice } from '../../../entities/fashioncheck-notice.entity';
import { FashionCheckDbLoadPort } from '../../port/out/fashioncheck-db-load-port.interface';

@Injectable()
export class MariadbAdapter
  implements ContactSavePort, FashionCheckDbLoadPort, FashionCheckDbSavePort
{
  constructor(
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,
    @InjectRepository(FashionCheckNotice)
    private fashionCheckRepository: Repository<FashionCheckNotice>,
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
}
