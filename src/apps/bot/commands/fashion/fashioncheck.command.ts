import { Inject, Logger, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    Command,
    DiscordTransformedCommand,
} from '@discord-nestjs/core';
import { ContextMenuCommandInteraction,EmbedBuilder } from 'discord.js';
import { Submission } from 'snoowrap';
import { FashionCheckService } from './fashioncheck.service';

@Command({
    name: '패션체크',
    description: '이번 주의 패션체크를 확인합니다. 글로벌/한국 서비스 모두 동일합니다.',
})
export class FashionCheckCommand implements DiscordTransformedCommand<any> {
    constructor(
        @Inject(Logger) private readonly loggerService: LoggerService,
        private readonly configService: ConfigService,
        private readonly fashionCheckService: FashionCheckService) {
    }
    async handler(
        interaction: ContextMenuCommandInteraction,
    ): Promise<void> {
        await interaction.deferReply();

        this.fashionCheckService
            .getFashion()
            .then(async (fashionInfo) => {
                const embedMsg = this.getEmbedMessage(fashionInfo);
                await interaction.editReply({ embeds: [embedMsg] });
            })
            .catch(async err => {
                await interaction.editReply('오류가 발생해서 보여드릴 수 없네요.. 잠시 후에 다시 시도해보세요.');
                this.loggerService.error(err);
                console.error(err);
            });
    }

    private getEmbedMessage(fashionInfo: Submission) {
        return new EmbedBuilder()
            .setColor('#fc03f4')
            .setTitle(`패션 체크`)
            .setDescription(`${fashionInfo.title}\n(Powered By. Kaiyoko Star)\n\n글로벌과 한국 서버의 패션 체크는 동일합니다.`)
            .setTimestamp(new Date())
            .setFields(
                { name: '한국어' , value: `[Google 시트](https://docs.google.com/spreadsheets/d/1RvbOnwLVlAKq7GwXwc3tAjQFtxQyk9PqrHa1J3vVB-g/edit#gid=174904573)` }
            )
            .setURL(`https://www.reddit.com/${fashionInfo.permalink}`)
            .setImage(fashionInfo.url)
            .setThumbnail('https://styles.redditmedia.com/t5_c3dzb/styles/profileIcon_ugxkdcpuxbp51.png?width=256&height=256&crop=256:256,smart&s=a1f754e55d562256c326bbc97302bc7d895e3806')
            .setFooter({
                text: this.configService.get('APP_NAME'),
            });
    }
}