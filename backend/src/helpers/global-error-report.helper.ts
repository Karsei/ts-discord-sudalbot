import axios from 'axios';

export type ErrorLevel = 'critical' | 'error' | 'warn';
const errorLevelStatus = {
    critical: {
        label: '심각한 오류',
        color: 15548997,
    },
    error: {
        label: '오류',
        color: 10038562,
    },
    warn: {
        label: '경고',
        color: 15258703,
    },
};

const report = async (level: ErrorLevel, title: string, message?: string, stacktrace?: string) => {
    const fields: {name: string, value: string, inline: boolean}[] = [];
    if (stacktrace) {
        fields.push({
            name: 'Stacktrace',
            value: `${stacktrace}`,
            inline: false
        });
    }
    fields.push({
        name: '환경',
        value: process.env.NODE_ENV,
        inline: true
    });
    return await axios.post(process.env.DISCORD_ERROR_REPORT_WEBHOOK_URL, JSON.stringify({
        username: '달달이 오류보고',
        avatar_url: 'https://cdn.discordapp.com/avatars/589775904163627026/f235dc93edba16f1bf154f8807ff602f.webp?size=128',
        embeds: [{
            author: {
                name: errorLevelStatus[level].label,
            },
            title: title,
            description: message,
            fields: fields,
            color: errorLevelStatus[level].color,
            footer: {
                text: '달달이 오류보고'
            }
        }]
    }), { headers: { 'Content-Type': 'application/json' }});
}

const GlobalErrorReportLogger = {
    report
}

export default GlobalErrorReportLogger;