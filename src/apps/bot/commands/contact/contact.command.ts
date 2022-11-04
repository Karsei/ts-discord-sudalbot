import { Repository } from 'typeorm';
import { Inject, Logger, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    Command,
    DiscordCommand,
    InjectDiscordClient,
    On,
    UseGuards,
} from '@discord-nestjs/core';
import { ModalActionRowComponentBuilder } from '@discordjs/builders';
import {
    ActionRowBuilder, Client,
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
export class ContactCommand implements DiscordCommand {
    private readonly requestParticipantModalId = 'RequestParticipant';
    private readonly summaryComponentId = 'summary';
    private readonly commentComponentId = 'comment';

    constructor(@InjectDiscordClient() private readonly client: Client,
                @Inject(Logger) private readonly loggerService: LoggerService,
                @InjectRepository(Contact) private contactRepository: Repository<Contact>) {
    }

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

    @On('interactionCreate')
    @UseGuards(IsModalInteractionGuard)
    async onModuleSubmit(
        modal: ModalSubmitInteraction,
    ) {
        this.loggerService.log(`${modal.member.user.username} 님이 제보하였습니다.`);

        if (modal.customId !== this.requestParticipantModalId) return;

        const contact = await this.saveContact(modal);

        await modal.reply(
            `**${contact.userName}** 님, 정상적으로 제보가 접수되었어요!`
            //+ codeBlock('markdown', comment),
        );
    }

    /**
     * 제보를 저장합니다.
     * @param modal modal 객체
     */
    private async saveContact(modal: ModalSubmitInteraction) {
        const contact = new Contact();
        contact.guildId = modal.guildId;
        contact.userId = modal.user.id;
        contact.userName = modal.user.username;
        contact.summary = modal.fields.fields.get(this.summaryComponentId).value;
        contact.comment = modal.fields.fields.get(this.commentComponentId).value;
        return await this.contactRepository.save(contact);
    }
}
