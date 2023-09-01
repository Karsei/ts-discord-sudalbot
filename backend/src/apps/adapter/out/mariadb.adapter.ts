import { InsertResult, Repository } from 'typeorm';
import { ModalSubmitInteraction } from 'discord.js';
import { Injectable } from '@nestjs/common';

import { ContactSavePort } from '../../port/out/contact-save-port.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Contact } from '../../../entities/contact.entity';
import { ContactCommand } from '../in/command/contact.command';

@Injectable()
export class MariadbAdapter implements ContactSavePort {
  constructor(
    @InjectRepository(Contact) private contactRepository: Repository<Contact>,
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
}
