import fs from 'fs';
import readline from "readline";
import {createClient as RedisCreateClient} from "redis";
import {CommandInteraction, Guild as DiscordGuild, Message as DiscordMessage} from 'discord.js';
import Logger from 'jet-logger';
// Http Server
import HttpServer from './server';
// Configs
import Setting from './shared/setting';
// @ts-ignore
import {author, version} from '../package.json';

const Discord = require('discord.js');
const DiscordRest = require('@discordjs/rest');
const DiscordTypes = require('discord-api-types/v9');

// Services
const NewsSchedulerService = require('./services/NewsSchedulerService');

// # 초기화 -----------------------------------------
console.log('FFXIV DalDalEE Tool Discord Bot');
console.log(`Author by. ${author}`);
console.log(`Version ${version}`);

// node 에서 허가되지 않은 인증 TLS 통신을 거부하지 않음
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// 봇 토큰이 없으면 사용 제한
if (Setting.DISCORD_BOT_TOKEN === '') {
    Logger.err('디스코드 봇 API 토큰 정보가 없습니다. 디스코드 개발자 센터에서 먼저 봇 토큰을 발급하고 이용하세요.');
    process.exit(1);
}

// 디스코드 봇 클라이언트 초기화
const discordBot = new Discord.Client({
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MESSAGES
    ]});
// 디스코드 봇 Rest 초기화
const discordRestBot = new DiscordRest.REST({ version: '9'}).setToken(Setting.DISCORD_BOT_TOKEN);
// 명령어 목록 로드
discordBot.commands = new Discord.Collection();
const commands: any = [];

// Redis 클라이언트 설정 준비
const redis = RedisCreateClient({
    socket: {
        host: Setting.REDIS_HOST,
        port: Setting.REDIS_PORT
    },
    database: Setting.REDIS_DB,
    password: Setting.REDIS_PASSWORD
});

// Redis 연결 구성
function makeRedisConnection(): Promise<void> {
    return new Promise<void>(async (resolve) => {
        Logger.info('Redis 연결중...');
        try {
            await redis.on('error', (err: any) => {
                Logger.err('Redis 오류가 발생했습니다.');
                Logger.err(err);
            });
            await redis.connect();
        }
        catch (err) {
            Logger.err('Redis 에 연결하는 과정에서 오류가 발생했습니다.');
            Logger.err(err);
            process.exit(2);
        }
        Logger.info(`Redis 연결 완료`);
        resolve();
    });
}
// 명령어 목록 초기화
function makeCommandList(): Promise<void> {
    return new Promise<void>(async (resolve) => {
        Logger.info('명령어 목록 초기화중...');
        try {
            for (const file of fs.readdirSync('./src/commands').filter(file => file.endsWith('.ts'))) {
                Logger.info(`명령어 발견 - ${file}`);
                await import(`./commands/${file}`)
                    .then(cModule => {
                        discordBot.commands.set(cModule.data.name, cModule);
                        commands.push(cModule.data.toJSON());
                    })
                    .catch(err => {
                        throw err;
                    });
            }
        }
        catch (err) {
            Logger.err('명령어 목록을 초기화하는 과정에서 오류가 발생했습니다.');
            Logger.err(err);
            process.exit(3);
        }
        Logger.info(`명령어 목록 초기화 완료 (총 ${commands.length}개)`);
        resolve();
    });
}
// 슬래시 명령어 구성
function makeSlashCommandList(): Promise<void> {
    return new Promise<void>(async (resolve) => {
        Logger.info('슬래시 명령어 구성중...');
        try {
            await discordRestBot.put(
                DiscordTypes.Routes.applicationCommands(Setting.DISCORD_BOT_CLIENT_ID),
                {body: commands},
            );
        }
        catch (err) {
            Logger.err('슬래시 명령어을 구성하는 과정에서 오류가 발생했습니다.');
            Logger.err(err);
            process.exit(4);
        }
        Logger.info(`슬래시 명령어 구성 완료`);
        resolve();
    });
}
// 디스코드 이벤트 구성
function makeDiscordBotEvents(): Promise<void> {
    return new Promise<void>(async (resolve) => {
        Logger.info('디스코드 이벤트 구성중...');
        try {
            /**
             * [Bot Handlers] Warn
             */
            discordBot.on('warn', (err: any) => Logger.err(err));

            /**
             * [Bot Handlers] Error
             */
            discordBot.on('error', (err: any) => Logger.err(err));

            /**
             * [Bot Handlers] 예외 발생
             */
            discordBot.on('uncaughtException', (err: any) => {
                Logger.err(err);
                process.exit(101);
            });

            /**
             * [Bot Handlers] 연결 재시도
             */
            discordBot.on('reconnecting', () => Logger.warn('다시 연결하고 있습니다...'));

            /**
             * [Bot Handlers] 연결 종료
             */
            discordBot.on('disconnect', () => {
                Logger.warn('서버와의 연결이 끊겼습니다.');
                process.exit(102);
            });

            /**
             * [Bot Handlers] Ready (after bot client is logged)
             */
            discordBot.on('ready', () => {
                discordBot.user?.setActivity('지켜보고 있다.. +_+');
            });

            /**
             * [Bot Handlers] After user added bot
             */
            discordBot.on('guildCreate', async (guild: DiscordGuild) => {
                try {
                    const serverId = guild.id;
                    const serverName = guild.name;

                    Logger.info(`${serverName} (${serverId}) - 봇이 추가되었습니다.`);
                }
                catch (err) {
                    Logger.err(err);
                }
            });

            /**
             * [Bot Handlers] After user deleted bot
             */
            discordBot.on('guildDelete', async (guild: DiscordGuild) => {
                try {
                    const serverId = guild.id;
                    const serverName = guild.name;

                    Logger.info(`${serverName} (${serverId}) - 봇이 삭제되었습니다.`);
                }
                catch (err) {
                    Logger.err(err);
                }
            });

            /**
             * [Bot Handlers] interaction Message
             */
            discordBot.on('interactionCreate', async (interaction: CommandInteraction) => {
                if (!interaction.isCommand()) return;

                const command = discordBot.commands.get(interaction.commandName);
                if (!command)   return;

                try {
                    await command.execute(interaction);
                }
                catch (commandErr) {
                    Logger.err(commandErr);
                    await interaction.reply({content: '명령어를 실행하는 과정에서 오류가 발생했어요.'});
                }
            });

            /**
             * [Bot Handlers] Messages
             */
            discordBot.on('messageCreate', async (message: DiscordMessage) => {
                if (message.author.bot || message.webhookId) return;
            });
        }
        catch (err) {
            Logger.err('디스코드 이벤트를 구성하는 과정에서 오류가 발생했습니다.');
            Logger.err(err);
            process.exit(5);
        }
        Logger.info(`디스코드 이벤트 구성 완료`);
        resolve();
    });
}
// 디스코드 봇 로그인
function makeDiscordBotLogin(): Promise<void> {
    return new Promise<void>(async (resolve) => {
        Logger.info('디스코드 봇 로그인...');
        try {
            discordBot
                .login(Setting.DISCORD_BOT_TOKEN)
                .then(() => {
                    Logger.info(`${discordBot.user?.tag} 으로 로그인되었습니다.`);
                    Logger.info(`디스코드 봇 로그인 완료`);
                    resolve();
                })
                .catch((err: any) => {
                    throw err;
                });
        }
        catch (err) {
            Logger.err('디스코드 봇 로그인을 하는 과정에서 오류가 발생했습니다.');
            Logger.err(err);
            process.exit(6);
        }
    });
}
// 스케줄러 등록
function makeScheduler(): Promise<void> {
    return new Promise<void>(async (resolve) => {
        Logger.info('스케줄러 등록중...');
        try {
            const scheduler = new NewsSchedulerService(redis);
            scheduler.run();
            Logger.info(`스케줄러 등록 완료`);
            resolve();
        }
        catch (err) {
            Logger.err('스케줄러 등록을 하는 과정에서 오류가 발생했습니다.');
            Logger.err(err);
            process.exit(7);
        }
    });
}
// 웹 서버 구성
function makeHttpServer(): Promise<void> {
    return new Promise<void>(async (resolve) => {
        Logger.info('웹 서버 구성중...');
        try {
            const port = 3000;
            HttpServer(redis).listen(port, () => {
                Logger.info(`웹 서버가 포트 ${port} 으로 시작되었습니다.`);
                Logger.info(`웹 서버 구성 완료`);
                resolve();
            });
        }
        catch (err) {
            Logger.err('웹 서버 구성을 하는 과정에서 오류가 발생했습니다.');
            Logger.err(err);
            process.exit(8);
        }
    });
}
// Cli 구성
function makeCli(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        try {
            const r = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            r.on('line', async (line) => {
                const args = line.split(' ');

                if (line) {
                    let cmd = args[0];

                    try {
                        switch (cmd) {
                            case 'stop':
                            case 'exit': {
                                Logger.info('종료합니다...');
                                r.close();
                                break;
                            }
                            default: {
                                Logger.err('오류: 알 수 없는 명령어입니다.');
                                break;
                            }
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }
                r.prompt();
            });
            r.on('close', () => {
                process.exit(0);
            });
            r.setPrompt('> ');

            Logger.info('준비 완료');
            r.prompt();
        }
        catch (err) {
            reject(err);
        }
        resolve();
    });
}

makeRedisConnection()
    .then(() => makeCommandList())
    .then(() => makeSlashCommandList())
    .then(() => makeDiscordBotEvents())
    .then(() => makeDiscordBotLogin())
    .then(() => makeScheduler())
    .then(() => makeHttpServer())
    .then(() => makeCli())
    .catch(err => {
        Logger.err(err);
        process.exit(100);
    });