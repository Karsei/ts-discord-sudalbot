const winston = require('winston');
require('winston-daily-rotate-file');

const level = () => {
    // const env = process.env;
    return 'debug';
}

const colors: any = {
    error: '\x1b[31m',
    warn: '\x1b[33m',
    info: '\x1b[32m',
    http: '\x1b[35m',
    debug: '\x1b[34m',
};

const format = winston.format.combine(
    winston.format.errors({ stack: true }),
    // winston.format.json(),
    // winston.format.timestamp({ format: 'YYYY-MM-DD HH:MM-SS' }),
    winston.format.timestamp({ format: 'isoDateTime' }),
    winston.format.ms(),
    winston.format.printf((info: any) => {
        const msg = info.hasOwnProperty('message') ? info.message : '';
        const error = info.hasOwnProperty('stack') ? ` \nCaused by: ${info.stack}` : '';
        // https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
        return `${colors[info.level]}[${info.timestamp}] [${info.level.toUpperCase()}] - ${msg}${error}\x1b[0m`;
    }),
);

const logger = winston.createLogger({
    // 형식
    format,
    // 최소 레벨
    level: level(),
    // 출력
    transports: [
        // 파일 저장 (info)
        new winston.transports.DailyRotateFile({
            level: 'info',
            datePattern: 'YYYY-MM-DD',
            dirname: './logs',
            filename: `%DATE%.log`,
            zippedArchive: true,
            handleExceptions: true,
        }),
        // 파일 저장 (error)
        new winston.transports.DailyRotateFile({
            level: 'error',
            datePattern: 'YYYY-MM-DD',
            dirname: './logs',
            filename: `%DATE%.error.log`,
            zippedArchive: true,
        }),
        // 콘솔 출력
        new winston.transports.Console({
            handleExceptions: true,
        })
    ]
});

module.exports = logger;
