# nestjs-study

NestJS 테스트 및 사용법 관련

## Install

https://github.com/nestjs/typescript-starter 에서 시작해도 됨

```bash
# cli 설치
$ npm i -g @nestjs/cli

# 프로젝트 초기화
$ nest new [project-name]
⚡  We will scaffold your app in a few seconds..

CREATE nestjs-study/.eslintrc.js (665 bytes)
CREATE nestjs-study/.prettierrc (51 bytes)
CREATE nestjs-study/README.md (3340 bytes)
CREATE nestjs-study/nest-cli.json (118 bytes)
CREATE nestjs-study/package.json (1997 bytes)
CREATE nestjs-study/tsconfig.build.json (97 bytes)
CREATE nestjs-study/tsconfig.json (546 bytes)
CREATE nestjs-study/src/app.controller.spec.ts (617 bytes)
CREATE nestjs-study/src/app.controller.ts (274 bytes)
CREATE nestjs-study/src/app.module.ts (249 bytes)
CREATE nestjs-study/src/app.service.ts (142 bytes)
CREATE nestjs-study/src/main.ts (208 bytes)
CREATE nestjs-study/test/app.e2e-spec.ts (630 bytes)
CREATE nestjs-study/test/jest-e2e.json (183 bytes)

? Which package manager would you ❤️  to use? (Use arrow keys)
❯ npm
  yarn
  pnpm
```

```bash
$ docker compose build --no-cache

# dev
$ docker compose --profile dev up

# dev with only infrastructures
$ docker compose --profile infra-only up

# prod
$ docker compose --profile prod up
```

## 추가사항

* 환경 분리 (prod 의 경우 따로 명령어로 주입)
* 모듈 분리
* Logger Winston 대체
* Docker Compose 작성

---

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).
