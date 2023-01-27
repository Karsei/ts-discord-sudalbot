import { Command, DiscordTransformedCommand } from '@discord-nestjs/core';
import { ContextMenuCommandInteraction } from 'discord.js';
import { UptimeService } from './uptime.service';

@Command({
  name: '업타임',
  description: '서버 로드로부터 경과된 시간을 출력합니다.',
})
export class UptimeCommand implements DiscordTransformedCommand<any> {
  constructor(private readonly uptimeService: UptimeService) {}

  async handler(interaction: ContextMenuCommandInteraction): Promise<void> {
    await interaction.deferReply();
    await interaction.editReply(
      `서버가 실행된 후 ${this.uptimeService.getUpTime()} 가 경과했습니다.`,
    );
  }
}
