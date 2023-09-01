import { ModalSubmitInteraction } from 'discord.js';
import { InsertResult } from 'typeorm';

export interface ContactSavePort {
  saveContact(modal: ModalSubmitInteraction): Promise<InsertResult>;
}

export const ContactSavePortToken = Symbol('ContactSavePort');
