import { InjectDiscordClient, Once, On, UseGuards } from '@discord-nestjs/core';
import { Injectable, Logger } from '@nestjs/common';
import { Client, Guild, Message, ModalSubmitInteraction } from 'discord.js';

import { MessageFromUserGuard } from './guards/message-from-user.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Contact } from '../../entities/contact.entity';
import { Repository } from 'typeorm';
import { Chat } from '../../entities/chat.entity';

@Injectable()
export class BotGateway {
  private readonly logger = new Logger(BotGateway.name);

  constructor(
    @InjectDiscordClient()
    private readonly client: Client,
    @InjectRepository(Chat) private chatRepository: Repository<Chat>,
  ) {}

  @Once('ready')
  onReady() {
    this.logger.log(`Bot ${this.client.user.tag} was started!`);
    this.client.user.setActivity('지켜보고 있다.. +_+');
  }

  @Once('disconnect')
  onDisconnect() {
    this.logger.log(`application was disconnected.`);
    process.exit(102);
  }

  @On('guildCreate')
  async onGuildCreate(guild: Guild) {
    this.logger.log(
      `Successful adding this bot to server. (Id: ${guild.id}, Name: ${guild.name})`,
    );
  }

  @On('guildDelete')
  async onGuildDelete(guild: Guild) {
    this.logger.log(
      `Successful removing this bot from server. (Id: ${guild.id}, Name: ${guild.name})`,
    );
  }

  @On('messageCreate')
  @UseGuards(MessageFromUserGuard)
  async onMessageCreate(message: Message) {
    await this.saveChat(message);
  }

  /**
   * 채팅 로그를 저장합니다.
   * @param message message 객체
   */
  private async saveChat(message: Message) {
    const serverId = message.guildId,
      serverName = message.guild.name,
      userId = message.author.id,
      userName = message.author.username;
    return await this.chatRepository.insert({
      guild: { id: serverId },
      guildName: serverName,
      userId: userId,
      userName: userName,
      content: message.content,
    });
  }
}
