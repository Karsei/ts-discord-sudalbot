import {CommandInteraction} from 'discord.js';
import {SlashCommandBuilder} from '@discordjs/builders';

const oStartDate: Date = new Date();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('업타임')
        .setDescription('서버 로드로부터 경과된 시간을 출력합니다.'),
    async execute(interaction: CommandInteraction) {
        let _sec = 1000;
        let _min = _sec * 60;
        let _hour = _min * 60;
        let _day = _hour * 24;

        let curDate: Date = new Date();
        let diffDate = curDate.valueOf() - oStartDate.valueOf();
        let d_day = Math.floor(diffDate / _day);
        let d_hour = Math.floor((diffDate % _day) / _hour);
        let d_min = Math.floor((diffDate % _hour) / _min);
        let d_sec = Math.floor((diffDate % _min) / _sec);
        let d_msec = diffDate % _sec;

        let diffDateStr = '';
        if (d_day > 0)  diffDateStr += d_day + '일 ';
        if (d_hour > 0) diffDateStr += d_hour + '시간 ';
        if (d_min > 0)  diffDateStr += d_min + '분 ';
        if (d_sec > 0)  diffDateStr += d_sec + '초 ';
        if (d_msec > 0)  diffDateStr += d_msec + '';

        await interaction.reply(`서버가 실행된 후 ${diffDateStr} 가 경과했습니다.`);
    },
};