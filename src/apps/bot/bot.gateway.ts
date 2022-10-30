import {InjectDiscordClient, Once, On, UseGuards} from '@discord-nestjs/core';
import { Injectable, Logger } from '@nestjs/common';
import {Client, Guild, Message} from 'discord.js';

import { MessageFromUserGuard } from './guards/message-from-user.guard';

@Injectable()
export class BotGateway {
    private readonly logger = new Logger(BotGateway.name);

    constructor(
        @InjectDiscordClient()
        private readonly client: Client,
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
        this.logger.log(`Successful adding this bot to server. (Id: ${guild.id}, Name: ${guild.name})`);
    }

    @On('guildDelete')
    async onGuildDelete(guild: Guild) {
        this.logger.log(`Successful removing this bot from server. (Id: ${guild.id}, Name: ${guild.name})`);
    }

    @On('messageCreate')
    @UseGuards(MessageFromUserGuard)
    async onMessageCreate(message: Message) {
        this.logger.log(`Incoming Message: ${message.content}`);
    }
}