// Express Server
import express, { NextFunction, Request, Response } from 'express';
const app = express();
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import path from 'path';
const Logger = require('./libs/logger');

// Config
import Setting from './shared/setting';
import BotAuthParams from './shared/botAuthParams';

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

            await require('./services/NewsWebhookService').default.subscribe(params);
            res.send(`<script>alert('봇이 추가되었습니다. 디스코드를 확인하세요.'); window.location.href = '${Setting.DISCORD_URL_BOT_HOST}';</script>`);
        } catch (error) {
            Logger.error('봇을 추가하는 과정에서 오류가 발생했습니다.', error);
            res.send(`<script>alert('봇을 추가하는 과정에서 오류가 발생했습니다.'); window.location.href = '${Setting.DISCORD_URL_BOT_HOST}';</script>`);
        }
    });

    return app;
}

export default init;