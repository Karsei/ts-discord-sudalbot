# DalDalEE Bot

This provides several useful features related to Final Fantasy XIV with Discord. Currently primary features are printing FFXIV Lodestone / Korean official archives, Fashion Check and fflogs report messages.

## Requirements

* Node.js 16.6.0 or newer is required.
* Redis 6.x or newer is required.

## How to use

```bash
# install modules
$ npm install

# run
$ npm start
```

Open the `shared/constants.js` file and edit discord bot configs and more.

```
// Discord Bot Client ID
DISCORD_BOT_CLIENT_ID: '',

// Discord Bot Client Secret
DISCORD_BOT_CLIENT_SECRET: '',

// Discord Bot Token
DISCORD_BOT_TOKEN: '',

// FFLogs 웹 토큰
FFLOGS_WEB_TOKEN: '',

...
```


# 달달이봇

파이널 판타지 14 와 관련된 소식이나 여러 기능을 디스코드를 통하여 이용할 수 있게 해줍니다. 현재 주요 기능은 로드스톤 또는 한국 서비스의 아카이브를 불러오거나 패션체크 등의 확인 기능이 있습니다.   

## 요구사항

* Node.js 16.6.0 또는 그 이상의 버전
* Redis 6.x 또는 그 이상의 버전

## How to use

```bash
# install modules
$ npm install

# run
$ npm start
```

`shared/constants.js` 파일을 열어서 디스코드 봇 토큰이나 여러 설정을 수정합니다.

```
// Discord Bot Client ID
DISCORD_BOT_CLIENT_ID: '',

// Discord Bot Client Secret
DISCORD_BOT_CLIENT_SECRET: '',

// Discord Bot Token
DISCORD_BOT_TOKEN: '',

// FFLogs 웹 토큰
FFLOGS_WEB_TOKEN: '',

...
```