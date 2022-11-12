# 달달이봇

<p align="center">
  <a href="" target="blank"><img src="./images/daldalee.png" width="256" alt="Daldalee Logo" /></a>
</p>

  <p align="center">로드스톤에서 글로벌과 한국 서비스 소식을 구독하여 실시간으로 전달받거나 아이템 검색, 패션체크 등을 사람들과 함께 쉽게 이용할 수 있도록 만들어진 디스코드 봇입니다.</p>

## 사용법

1. `.env` 파일에 필요한 사항을 적습니다.
2. 해당 프로젝트는 docker 를 이용합니다. 아래 명령어를 통해 쉽게 이용할 수 있습니다.

```bash
$ docker compose up
```

인프라만 따로 실행하고 싶다면 아래와 같이 입력하시면 됩니다.

```bash
$ docker compose --profile infra-only up
```