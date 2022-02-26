import fs from 'fs';
import readline from 'readline';
// Discord
const Discord = require('discord.js');
import {CommandInteraction, Guild as DiscordGuild, Message, Message as DiscordMessage, MessageEmbed} from 'discord.js';
const DiscordRest = require('@discordjs/rest');
const DiscordTypes = require('discord-api-types/v9');
const { Player } = require('discord-music-player');
// Logger
const Logger = require('./libs/logger');
// MariaDb
import MariaDbConnection from './libs/mariadb';
// Redis
import RedisConnection from './libs/redis';
// Http Server
import HttpServer from './server';
// Configs
import Setting from './shared/setting';
// @ts-ignore
import {author, version} from '../package.json';
import {Playlist, Queue, Song} from "discord-music-player";

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
// 디스모크 음악 플레이어 초기화
const discordPlayer = new Player(discordBot, {
    leaveOnEmpty: true,
    leaveOnStop: false,
    leaveOnEnd: false,
    timeout: 60000,
});
discordBot.player = discordPlayer;
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
            await MariaDbConnection.init();
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
            await RedisConnection.init();
        }
        catch (err) {
            Logger.error('Redis 에 연결하는 과정에서 오류가 발생했습니다.', err);
            process.exit(3);
        }
        Logger.info(`Redis 연결 완료`);
        resolve();
    });
}
// 한국어 데이터 조회
function makeKoreanGameDatas(): Promise<void> {
    return new Promise<void>(async (resolve) => {
        Logger.info('한국어 게임 데이터 초기화중...');
        try {
            //await require('./serverTask/storeKoreanData').default.init();
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
            const NewsSchedulerService = require('./services/NewsSchedulerService');
            const scheduler = new NewsSchedulerService();
            scheduler.run();
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
// 음악 초기화
function makeMusicPlayer(): Promise<void> {
    return new Promise<void>(async (resolve) => {
        Logger.info('음악 플레이어 초기화중...');
        try {
            discordBot.player
                // 음성 채팅방에 아무도 없을 때
                .on('channelEmpty', (queue: Queue) => {
                    const interaction: CommandInteraction = queue.data.interaction;
                    interaction.channel?.send('현재 음성 채팅 방에 아무도 없어서 재생을 중단할게요.');
                })
                // 대기열에 음악이 추가되었을 경우
                .on('songAdd', (queue: Queue, song: Song) => {
                    const interaction: CommandInteraction = queue.data.interaction;
                    interaction.channel?.send(`대기열에 \`${song}\` 음악이 추가되었어요.`);
                })
                // 대기열에 재생목록이 추가되었을 때
                .on('playlistAdd', (queue: Queue, playlist: Playlist) => {
                    const interaction: CommandInteraction = queue.data.interaction;
                    interaction.channel?.send(`총 ${playlist.songs.length}개의 음악이 담긴 \`${playlist}\` 재생목록이 대기열에 추가되었어요.`);
                })
                // 더 이상 재생할 음악이 없을 때
                .on('queueDestroyed', (queue: Queue) => {
                    const interaction: CommandInteraction = queue.data.interaction;
                    interaction.channel?.send(`재생할 음악이 없어요!`);
                })
                // 대기열에 더 이상 재생할 음악이 없을 때 (끝나거나 멈추었을 경우)
                .on('queueEnd', (queue: Queue) => {
                    const interaction: CommandInteraction = queue.data.interaction;
                    interaction.channel?.send(`재생이 종료되었어요.`);
                })
                // 음악이 변경될 때
                .on('songChanged', async (queue: Queue, newSong: Song, oldSong: Song) => {
                    const interaction: CommandInteraction = queue.data.interaction;
                    const embedMsg: MessageEmbed = new MessageEmbed()
                        .setColor('#eb8634')
                        .setTitle(`${newSong.name}`)
                        .setAuthor({
                            name: '지금 재생중'
                        })
                        .addFields(
                            { name: `올린이`, value: newSong.author, inline: true },
                            { name: `재생 시간`, value: newSong.duration, inline: true },
                            { name: `요청자`, value: newSong.requestedBy?.username || '' },
                        )
                        .setTimestamp(new Date())
                        .setURL(newSong.url)
                        .setThumbnail(newSong.thumbnail)
                        .setFooter({
                            text: Setting.APP_NAME,
                        });
                    await interaction.channel?.send({ embeds: [embedMsg] });
                })
                // 대기열에 있는 첫 번째 음악이 이제 막 재생을 시작할 때
                .on('songFirst', async (queue: Queue, song: Song) => {
                    const interaction: CommandInteraction = queue.data.interaction;
                    const embedMsg: MessageEmbed = new MessageEmbed()
                        .setColor('#eb8634')
                        .setTitle(`${song.name}`)
                        .setAuthor({
                            name: '지금 재생중'
                        })
                        .addFields(
                            { name: `올린이`, value: song.author, inline: true },
                            { name: `재생 시간`, value: song.duration, inline: true },
                            { name: `요청자`, value: song.requestedBy?.username || '' },
                        )
                        .setTimestamp(new Date())
                        .setURL(song.url)
                        .setThumbnail(song.thumbnail)
                        .setFooter({
                            text: Setting.APP_NAME,
                        });
                    await interaction.channel?.send({ embeds: [embedMsg] });
                })
                // 채널에서 봇을 추방했을 경우
                //.on('clientDisconnect', (queue: Queue) => {
                //    const interaction: CommandInteraction = queue.data.interaction;
                //    if (interaction.channel) {
                //        interaction.channel.send(`채널에서 추방되어 음악 재생이 중단되었어요.`);
                //    }
                //})
                // 음소거가 되었을 경우
                .on('clientUndeafen', (queue: Queue) => {
                    const interaction: CommandInteraction = queue.data.interaction;
                    interaction.channel?.send(`음소거 상태에요.`);
                })
                // 실행중인 상태에서 오류가 발생할 때
                .on('error', (error: any, queue: Queue) => {
                    const interaction: CommandInteraction = queue.data.interaction;
                    interaction.channel?.send(`오류가 발생했어요! 다시 시도해주세요.`);
                    Logger.error(`음악 조작 시 오류가 발생했습니다: [${queue.guild.name}] ${error}`);
                });
            Logger.info(`음악 플레이어 초기화 완료`);
            resolve();
        }
        catch (err) {
            Logger.error('음악 플레이어 초기화를 하는 과정에서 오류가 발생했습니다.', err);
            process.exit(10);
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
    .then(() => makeKoreanGameDatas())
    .then(() => makeCommandList())
    .then(() => makeSlashCommandList())
    .then(() => makeDiscordBotEvents())
    .then(() => makeDiscordBotLogin())
    .then(() => makeScheduler())
    .then(() => makeHttpServer())
    .then(() => makeMusicPlayer())
    .then(() => makeCli())
    .catch(err => {
        Logger.error(err);
        process.exit(100);
    });