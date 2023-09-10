import { Inject, Logger, LoggerService, UseGuards } from '@nestjs/common';
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
  PermissionsBitField,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';

import { IsModalInteractionGuard } from '../../../guard/is-modal-interaction.guard';
import {
  ContactSavePort,
  ContactSavePortToken,
} from '../../../port/out/contact-save-port.interface';

@Command({
  name: '제보하기',
  description: '봇 개발자에게 의견 또는 건의사항을 전달합니다.',
  dmPermission: false,
  defaultMemberPermissions: PermissionsBitField.Flags.ViewChannel,
})
export class ContactCommand {
  public static readonly REQUEST_PARTICIPANT_MODAL_ID = 'RequestParticipant';
  public static readonly SUMMARY_COMPONENT_ID = 'summary';
  public static readonly COMMENT_COMPONENT_ID = 'comment';

  constructor(
    @InjectDiscordClient()
    private readonly client: Client,
    @Inject(Logger)
    private readonly loggerService: LoggerService,
    @Inject(ContactSavePortToken)
    private readonly savePort: ContactSavePort,
  ) {}

  /**
   * 명령어 핸들러
   * @param interaction 명령 상호작용
   */
  @Handler()
  async handler(interaction: CommandInteraction): Promise<void> {
    const modal = new ModalBuilder()
      .setTitle('제보하기')
      .setCustomId(ContactCommand.REQUEST_PARTICIPANT_MODAL_ID);

    const userNameInputComponent = new TextInputBuilder()
      .setCustomId(ContactCommand.SUMMARY_COMPONENT_ID)
      .setLabel('제목')
      .setStyle(TextInputStyle.Short);

    const commentInputComponent = new TextInputBuilder()
      .setCustomId(ContactCommand.COMMENT_COMPONENT_ID)
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

    if (modal.customId !== ContactCommand.REQUEST_PARTICIPANT_MODAL_ID) return;

    await this.savePort.saveContact(modal);

    await modal.reply(
      `**${modal.user.username}** 님, 정상적으로 제보가 접수되었어요!`,
      //+ codeBlock('markdown', comment),
    );
  }
}
