import fs from 'fs';
import readline from 'readline';
import dotenv from "dotenv";
dotenv.config();

// Discord
const Discord = require('discord.js');
import {CommandInteraction, Guild as DiscordGuild, Message, Message as DiscordMessage} from 'discord.js';
const DiscordRest = require('@discordjs/rest');
const DiscordTypes = require('discord-api-types/v9');
// DB
import "reflect-metadata"
import mariadb from "mariadb";
import { createClient as RedisCreateClient, RedisClientType } from "redis";
// Service
import NewsArchiveService from "./service/news-archive-service";
import NewsWebhookService from "./service/news-webhook.service";
import NewsSchedulerService from "./service/news-scheduler.service";
// Adapter
import MariadbAdapter from "./lib/mariadb.adapter";
import RedisAdapter from "./lib/redis.adapter";
// Logger
const Logger = require('./lib/logger');
// Http Server
import HttpServer from './server';
// Configs
import Setting from './definition/setting';
// @ts-ignore
import {author, version} from '../package.json';

// # 초기화 -----------------------------------------
// 시작
console.log('FFXIV DalDalEE Tool Discord Bot');
console.log(`Author by. ${author}`);
console.log(`Version ${version}`);

// node 에서 허가되지 않은 인증 TLS 통신을 거부하지 않음
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// 봇 토큰이 없으면 사용 제한
if (Setting.DISCORD_BOT_TOKEN === '') {
    Logger.error('디스코드 봇 API 토큰 정보가 없습니다. 디스코드 개발자 센터에서 먼저 봇 토큰을 발급하고 이용하세요.');
    process.exit(1);
}

// 디스코드 봇 클라이언트 초기화
const discordBot = new Discord.Client({
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Discord.Intents.FLAGS.GUILD_VOICE_STATES,
    ]});
// 디스코드 봇 Rest 초기화
const discordRestBot = new DiscordRest.REST({ version: '9'}).setToken(Setting.DISCORD_BOT_TOKEN);
// 명령어 목록 로드
discordBot.commands = new Discord.Collection();
const commands: any = [];

// MariaDB 연결 구성
function makeMariaDbConnection(): Promise<void> {
    return new Promise<void>(async (resolve) => {
        Logger.info('MariaDb 연결중...');
        try {
            const dbPool = mariadb.createPool({
                host: Setting.MARIADB_HOST,
                database: Setting.MARIADB_DATABASE,
                user: Setting.MARIADB_USER,
                password: Setting.MARIADB_PASSWORD,
                port: Setting.MARIADB_PORT,
                connectionLimit: Setting.MARIADB_CONNECTION_LIMIT,
                connectTimeout: 5000,
                acquireTimeout: 5000,
                idleTimeout: 0,
            });
            const dbCon = await dbPool.getConnection();
            discordBot.mariadb = new MariadbAdapter(dbCon);

            setInterval(() => {
                discordBot.mariadb.selectOne();
            }, 1000);
        }
        catch (err) {
            Logger.error('MariaDb 에 연결하는 과정에서 오류가 발생했습니다.', err);
            process.exit(2);
        }
        Logger.info(`MariaDb 연결 완료`);
        resolve();
    });
}
// Redis 연결 구성
function makeRedisConnection(): Promise<void> {
    return new Promise<void>(async (resolve) => {
        Logger.info('Redis 연결중...');
        try {
            const redisCon: RedisClientType<any, any> = RedisCreateClient({
                socket: {
                    host: Setting.REDIS_HOST,
                    port: Setting.REDIS_PORT
                },
                database: Setting.REDIS_DB,
                password: Setting.REDIS_PASSWORD
            });
            await redisCon.on('error', (err: any) => {
                Logger.error('Redis 오류가 발생했습니다.', err);
            });
            await redisCon.connect();
            discordBot.redis = new RedisAdapter(redisCon);
        }
        catch (err) {
            Logger.error('Redis 에 연결하는 과정에서 오류가 발생했습니다.', err);
            process.exit(3);
        }
        Logger.info(`Redis 연결 완료`);
        resolve();
    });
}
// 서비스 초기화
function makeServiceInitialization() {
    return new Promise<void>(async (resolve) => {
        try {
            discordBot.service = {};
            discordBot.service.newsArchiveService = new NewsArchiveService(discordBot);
            discordBot.service.newsWebhookService = new NewsWebhookService(discordBot, discordBot.service.newsArchiveService);
            discordBot.service.newsSchedulerService = new NewsSchedulerService(discordBot.service.newsWebhookService);
        }
        catch (err) {
            Logger.error('디스코드 서비스를 등록하는 과정에서 오류가 발생했습니다.', err);
            process.exit(3);
        }
        Logger.info(`디스코드 서비스 등록 완료`);
        resolve();
    });
}
// 한국어 데이터 조회
function makeKoreanGameDatas(): Promise<void> {
    return new Promise<void>(async (resolve) => {
        Logger.info('한국어 게임 데이터 초기화중...');
        try {
            //await require('./task/storeKoreanData').default.init();
        }
        catch (err) {
            Logger.error('한국어 게임 데이터를 초기화하는 과정에서 오류가 발생했습니다.', err);
            process.exit(3);
        }
        Logger.info(`한국어 게임 데이터 초기화 완료`);
        resolve();
    });
}
// 명령어 목록 초기화
function makeCommandList(): Promise<void> {
    return new Promise<void>(async (resolve) => {
        Logger.info('명령어 목록 초기화중...');
        try {
            for (const file of fs.readdirSync('./src/command').filter(file => file.endsWith('.ts'))) {
                Logger.info(`명령어 발견 - ${file}`);
                await import(`./command/${file}`)
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
            Logger.error('명령어 목록을 초기화하는 과정에서 오류가 발생했습니다.', err);
            process.exit(4);
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
            Logger.error('슬래시 명령어을 구성하는 과정에서 오류가 발생했습니다.', err);
            process.exit(5);
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
            discordBot.on('warn', (err: any) => Logger.error(err));

            /**
             * [Bot Handlers] Error
             */
            discordBot.on('error', (err: any) => Logger.error(err));

            /**
             * [Bot Handlers] 예외 발생
             */
            discordBot.on('uncaughtException', (err: any) => {
                Logger.error(err);
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
                    Logger.error(err);
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
                    Logger.error(err);
                }
            });

            /**
             * [Bot Handlers] interaction Message
             */
            discordBot.on('interactionCreate', async (interaction: CommandInteraction) => {
                if (interaction.isSelectMenu()) {
                    const message = interaction.message;
                    if (message instanceof Message) {
                        const command = discordBot.commands.get(message.interaction?.commandName);
                        await command.selectExecute(interaction);
                    }
                }
                else if (interaction.isCommand()) {
                    const command = discordBot.commands.get(interaction.commandName);
                    if (!command)   return;

                    try {
                        await command.execute(interaction);
                    }
                    catch (commandErr) {
                        Logger.error(commandErr);
                        await interaction.reply({content: '명령어를 실행하는 과정에서 오류가 발생했어요.'});
                    }
                }
                else {
                    return;
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
            Logger.error('디스코드 이벤트를 구성하는 과정에서 오류가 발생했습니다.', err);
            process.exit(6);
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
            Logger.error('디스코드 봇 로그인을 하는 과정에서 오류가 발생했습니다.', err);
            process.exit(7);
        }
    });
}
// 스케줄러 등록
function makeScheduler(): Promise<void> {
    return new Promise<void>(async (resolve) => {
        Logger.info('스케줄러 등록중...');
        try {
            discordBot.service.newsSchedulerService.run();
            Logger.info(`스케줄러 등록 완료`);
            resolve();
        }
        catch (err) {
            Logger.error('스케줄러 등록을 하는 과정에서 오류가 발생했습니다.', err);
            process.exit(8);
        }
    });
}
// 웹 서버 구성
function makeHttpServer(): Promise<void> {
    return new Promise<void>(async (resolve) => {
        Logger.info('웹 서버 구성중...');
        try {
            HttpServer().listen(Setting.HTTP_SERVER_PORT, () => {
                Logger.info(`웹 서버가 포트 ${Setting.HTTP_SERVER_PORT} 으로 시작되었습니다.`);
                Logger.info(`웹 서버 구성 완료`);
                resolve();
            });
        }
        catch (err) {
            Logger.error('웹 서버 구성을 하는 과정에서 오류가 발생했습니다.', err);
            process.exit(9);
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
                                Logger.error('오류: 알 수 없는 명령어입니다.');
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

makeMariaDbConnection()
    .then(() => makeRedisConnection())
    .then(() => makeServiceInitialization())
    .then(() => makeKoreanGameDatas())
    .then(() => makeCommandList())
    .then(() => makeSlashCommandList())
    .then(() => makeDiscordBotEvents())
    .then(() => makeDiscordBotLogin())
    .then(() => makeScheduler())
    .then(() => makeHttpServer())
    .then(() => makeCli())
    .catch(err => {
        Logger.error(err);
        process.exit(100);
    });