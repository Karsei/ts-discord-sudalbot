import axios from 'axios';
import {MessageEmbed} from 'discord.js';
// Express Server
import express, { Request, Response } from 'express';
const app = express();
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import path from 'path';
const Logger = require('./lib/logger');

// Config
import Setting from './definition/setting';
import BotAuthParams from './definition/botAuthParams';

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
// app.use(helmet());

const viewsDir = path.join(__dirname, 'views');
app.set('views', viewsDir);
const staticDir = path.join(__dirname, 'public');

app.use(express.static(staticDir));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.set(`view engine`, `ejs`);

app.get('/', (req: Request, res: Response) => {
    res.render('index', {
        authorize_url: Setting.DISCORD_URL_OAUTH_AUTHORIZED,
        client_id: Setting.DISCORD_BOT_CLIENT_ID,
        redirect_uri: `${Setting.DISCORD_URL_BOT_HOST}/authorize`,
    });
});

function init() {
    app.get('/authorize', async (req: Request, res: Response) => {
        // https://discord.com/developers/docs/topics/oauth2
        const params = req.query as unknown as BotAuthParams;

        try {
            if (!params?.code) {
                throw new Error(`parameter 'code' is not found`);
            }
            if (!params?.guild_id) {
                throw new Error(`parameter 'guild_id' is not found`);
            }

            const webhookUrl = await require('./service/news-webhook.service').default.subscribe(params);
            const msg =  new MessageEmbed()
                .setColor('#0c9c54')
                .setTitle('이곳에 소식이 추가될 예정이에요!')
                .setDescription(`봇을 추가하셔서 고맙습니다! 파이널 판타지 14 관련 소식은 앞으로 해당 채널에 등록되게 되어요. 채널을 변경하고 싶다면, 서버 설정의 '연동' 에서 '달달이' 의 웹훅 설정을 변경해주세요.\n참고로 소식 종류는 \`/소식추가\` 또는 \`/소식삭제\` 명령어로 변경하실 수 있어요.`)
                .setTimestamp(new Date())
                .setFooter({
                    text: Setting.APP_NAME as string,
                });
            await axios({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: webhookUrl,
                data: { embeds: [msg] },
            });
            res.send(`<script>alert('봇이 추가되었습니다. 디스코드를 확인하세요.'); window.location.href = '${Setting.DISCORD_URL_BOT_HOST}';</script>`);
        } catch (error) {
            Logger.error('봇을 추가하는 과정에서 오류가 발생했습니다.', error);
            res.send(`<script>alert('봇을 추가하는 과정에서 오류가 발생했습니다.'); window.location.href = '${Setting.DISCORD_URL_BOT_HOST}';</script>`);
        }
    });

    return app;
}

export default init;