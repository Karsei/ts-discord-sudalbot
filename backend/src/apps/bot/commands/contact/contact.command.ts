import { Repository } from 'typeorm';
import { Inject, Logger, LoggerService, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Command,
  EventParams,
  Handler,
  InjectDiscordClient,
  On,
} from '@discord-nestjs/core';
import { ModalActionRowComponentBuilder } from '@discordjs/builders';
import {
  ActionRowBuilder,
  Client,
  ClientEvents,
  CommandInteraction,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';

import { IsModalInteractionGuard } from '../../guards/is-modal-interaction.guard';
import { Contact } from '../../../../entities/contact.entity';

@Command({
  name: '제보하기',
  description: '봇 개발자에게 의견 또는 건의사항을 전달합니다.',
})
export class ContactCommand {
  private readonly requestParticipantModalId = 'RequestParticipant';
  private readonly summaryComponentId = 'summary';
  private readonly commentComponentId = 'comment';

  constructor(
    @InjectDiscordClient() private readonly client: Client,
    @Inject(Logger) private readonly loggerService: LoggerService,
    @InjectRepository(Contact) private contactRepository: Repository<Contact>,
  ) {}

  /**
   * 명령어 핸들러
   * @param interaction 명령 상호작용
   */
  @Handler()
  async handler(interaction: CommandInteraction): Promise<void> {
    const modal = new ModalBuilder()
      .setTitle('제보하기')
      .setCustomId(this.requestParticipantModalId);

    const userNameInputComponent = new TextInputBuilder()
      .setCustomId(this.summaryComponentId)
      .setLabel('제목')
      .setStyle(TextInputStyle.Short);

    const commentInputComponent = new TextInputBuilder()
      .setCustomId(this.commentComponentId)
      .setLabel('내용')
      .setStyle(TextInputStyle.Paragraph);

    const rows = [userNameInputComponent, commentInputComponent].map(
      (component) =>
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
          component,
        ),
    );

    modal.addComponents(...rows);

    await interaction.showModal(modal);
  }

  /**
   * Modal 에서 '확인' 버튼을 통해 제보할 경우
   * @param eventArgs
   */
  @On('interactionCreate')
  @UseGuards(IsModalInteractionGuard)
  async onModuleSubmit(
    @EventParams() eventArgs: ClientEvents['interactionCreate'],
  ) {
    const [modal] = eventArgs;
    if (!modal.isModalSubmit()) return;

    this.loggerService.log(
      `${modal.member.user.username} 님이 제보하였습니다.`,
    );

    if (modal.customId !== this.requestParticipantModalId) return;

    await this.saveContact(modal);

    await modal.reply(
      `**${modal.user.username}** 님, 정상적으로 제보가 접수되었어요!`,
      //+ codeBlock('markdown', comment),
    );
  }

  /**
   * 제보 저장
   * @param modal modal 제출 상호작용
   */
  private async saveContact(modal: ModalSubmitInteraction) {
    return await this.contactRepository.insert({
      guild: { id: modal.guildId },
      userId: modal.user.id,
      userName: modal.user.username,
      summary: modal.fields.fields.get(this.summaryComponentId).value,
      comment: modal.fields.fields.get(this.commentComponentId).value,
    });
  }
}
