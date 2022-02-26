import {CommandInteraction,MessageEmbed} from 'discord.js';
import {SlashCommandBuilder} from '@discordjs/builders';
import SnooWrap from 'snoowrap';
import RedditError from '../exceptions/RedditError';
const Logger = require('../libs/logger');
// Config
import Setting from '../shared/setting';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('패션체크')
        .setDescription('이번 주의 패션체크를 확인합니다. 글로벌/한국 서비스 모두 동일합니다.'),
    async execute(interaction: CommandInteraction) {
        await interaction.deferReply();
        try {
            const reddit = new SnooWrap({
                userAgent: 'DalDalee Discord Bot',
                clientId: Setting.REDDIT_CLIENT_ID,
                clientSecret: Setting.REDDIT_CLIENT_SECRET,
                refreshToken: Setting.REDDIT_CLIENT_REFRESH_TOKEN,
            });
            const subReddit = await reddit.getSubreddit('ffxiv').search({
                query: 'author:kaiyoko Fashion Report',
                sort: 'new'
            });
            if (!subReddit || subReddit.length <= 0)    throw new RedditError(`패션체크 최신 정보를 불러오는 과정에서 오류가 발생했습니다.`);

            const latest = subReddit[0];
            const embedMsg: MessageEmbed = new MessageEmbed()
                .setColor('#fc03f4')
                .setTitle(`패션 체크`)
                .setDescription(`${latest.title}\n(Powered By. Kaiyoko Star)\n\n글로벌과 한국 서버의 패션 체크는 동일합니다.`)
                .setTimestamp(new Date())
                .setFields(
                    { name: '한국어' , value: `[Google 시트](https://docs.google.com/spreadsheets/d/1RvbOnwLVlAKq7GwXwc3tAjQFtxQyk9PqrHa1J3vVB-g/edit#gid=174904573)` }
                )
                .setURL(`https://www.reddit.com/${latest.permalink}`)
                .setImage(latest.url)
                .setThumbnail('https://styles.redditmedia.com/t5_c3dzb/styles/profileIcon_ugxkdcpuxbp51.png?width=256&height=256&crop=256:256,smart&s=a1f754e55d562256c326bbc97302bc7d895e3806')
                .setFooter({
                    text: Setting.APP_NAME,
                })
            ;
            await interaction.editReply({ embeds: [embedMsg] });
        }
        catch (e) {
            if (e instanceof RedditError) {
                await interaction.editReply(e.message);
            } else if (e instanceof Error) {
                await interaction.editReply('오류가 발생해서 보여드릴 수 없네요.. 잠시 후에 다시 시도해보세요.');
                Logger.error(e.stack);
            } else {
                Logger.error(e);
            }
        }
    },
};