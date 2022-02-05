//
import fs from 'fs';
const Discord = require('discord.js');
import {CommandInteraction, Message as DiscordMessage} from 'discord.js';
const DiscordRest = require('@discordjs/rest');
const DiscordTypes = require('discord-api-types/v9');
import Logger from 'jet-logger';

// Configs
import { Constants } from "./shared/constants";
import readline from "readline";
// @ts-ignore
import {author, version} from '../package.json';

// # 초기화 -----------------------------------------
console.log('FFXIV DalDalEE Tool Discord Bot');
console.log(`Author by. ${author}`);
console.log(`Version ${version}`);

// 봇 토큰이 없으면 사용 제한
if (Constants.DISCORD_BOT_TOKEN === '') {
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
const discordRestBot = new DiscordRest.REST({ version: '9'}).setToken(Constants.DISCORD_BOT_TOKEN);
// 명령어 목록 로드
discordBot.commands = new Discord.Collection();
const commands: any = [];

// 명령어 초기화
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
            process.exit(2);
        }
        Logger.info(`명령어 목록 초기화 완료 (총 ${commands.length}개)`);
        resolve();
    });
}
function makeSlashCommandList(): Promise<void> {
    return new Promise<void>(async (resolve) => {
        Logger.info('슬래시 명령어 구성중...');
        try {
            await discordRestBot.put(
                DiscordTypes.Routes.applicationCommands(Constants.DISCORD_BOT_CLIENT_ID),
                {body: commands},
            );
        }
        catch (err) {
            Logger.err('슬래시 명령어을 구성하는 과정에서 오류가 발생했습니다.');
            Logger.err(err);
            process.exit(3);
        }
        Logger.info(`슬래시 명령어 구성 완료`);
        resolve();
    });
}
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
            process.exit(4);
        }
        Logger.info(`디스코드 이벤트 구성 완료`);
        resolve();
    });
}
function makeDiscordBotLogin(): Promise<void> {
    return new Promise<void>(async (resolve) => {
        Logger.info('디스코드 봇 로그인...');
        try {
            discordBot
                .login(Constants.DISCORD_BOT_TOKEN)
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
            process.exit(5);
        }
    });
}
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

makeCommandList()
    .then(() => makeSlashCommandList())
    .then(() => makeDiscordBotEvents())
    .then(() => makeDiscordBotLogin())
    .then(() => makeCli())
    .catch(err => {
        Logger.err(err);
        process.exit(100);
    });