const Setting = {
    // 이름
    APP_NAME: process.env.APP_NAME,

    // 웹 서버 포트
    HTTP_SERVER_PORT: process.env.HTTP_SERVER_PORT,

    // 기본 통신 프로토콜
    BASE_URL_PROTOCOL: process.env.BASE_URL_PROTOCOL,

    // 로드스톤 주소
    BASE_URL_LODESTONE: process.env.BASE_URL_LODESTONE,

    // 한국 파판 홈페이지 주소
    BASE_URL_KOREA: process.env.BASE_URL_KOREA,

    // Discord OAuth2 인증 주소
    DISCORD_URL_OAUTH_AUTHORIZED: process.env.DISCORD_URL_OAUTH_AUTHORIZED,

    // Discord OAuth2 토큰 주소
    DISCORD_URL_OAUTH_TOKEN: process.env.DISCORD_URL_OAUTH_TOKEN,

    // Discord Webhook API 주소
    DISCORD_URL_WEBHOOK: process.env.DISCORD_URL_WEBHOOK,

    // Discord Bot 웹 호스트 주소
    DISCORD_URL_BOT_HOST: process.env.DISCORD_URL_BOT_HOST,

    // Discord Bot Client ID
    DISCORD_BOT_CLIENT_ID: process.env.DISCORD_BOT_CLIENT_ID,

    // Discord Bot Client Secret
    DISCORD_BOT_CLIENT_SECRET: process.env.DISCORD_BOT_CLIENT_SECRET,

    // Discord Bot Token
    DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,

    // FFLogs 웹 토큰
    FFLOGS_WEB_TOKEN: process.env.FFLOGS_WEB_TOKEN,

    // Reddit Client ID
    REDDIT_CLIENT_ID: process.env.REDDIT_CLIENT_ID,

    // Reddit Client Secert
    REDDIT_CLIENT_SECRET: process.env.REDDIT_CLIENT_SECRET,

    // Reddit Refresh Token
    // https://not-an-aardvark.github.io/reddit-oauth-helper/
    REDDIT_CLIENT_REFRESH_TOKEN: process.env.REDDIT_CLIENT_REFRESH_TOKEN,

    // Reddit Access Token
    REDDIT_CLIENT_ACCESS_TOKEN: process.env.REDDIT_CLIENT_ACCESS_TOKEN,

    // REDIS HOST
    REDIS_HOST: process.env.REDIS_HOST,

    // REDIS PORT
    REDIS_PORT: parseInt(process.env.REDIS_PORT as string),

    // REDIS DATABASE
    REDIS_DB: parseInt(process.env.REDIS_DB as string),

    // REDIS AUTH
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,

    // XIVAPI KEY
    XIVAPI_KEY: process.env.XIVAPI_KEY,

    // MariaDb Host
    MARIADB_HOST: process.env.MARIADB_HOST,

    // MariaDb Port
    MARIADB_PORT: parseInt(process.env.MARIADB_PORT as string),

    // MariaDb Database
    MARIADB_DATABASE: process.env.MARIADB_DATABASE,

    // MariaDb User
    MARIADB_USER: process.env.MARIADB_USER,

    // MariaDb Password
    MARIADB_PASSWORD: process.env.MARIADB_PASSWORD,

    // MariaDb Connection Limit
    MARIADB_CONNECTION_LIMIT: parseInt(process.env.MARIADB_CONNECTION_LIMIT as string),
};

export default Setting;