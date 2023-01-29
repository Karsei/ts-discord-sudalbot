export enum YesNoFlag {
  YES = 'YES',
  NO = 'NO',
}

export enum Locales {
  '미국(영어)' = 'na',
  '유럽(영어)' = 'eu',
  '대한민국(한국어)' = 'kr',
  '일본(일본어)' = 'jp',
  '독일(독일어)' = 'de',
  '프랑스(프랑스어)' = 'fr',
}

export enum SubscribeArticleCategory {
  TOPICS = '토픽',
  NOTICES = '공지',
  MAINTENANCE = '점검',
  UPDATES = '업데이트',
  STATUS = '서버 상태',
  DEVELOPERS = '개발자 노트',
  EVENT = '이벤트',
  PATCHNOTE = '패치노트',
}

export interface PaginationParams {
  page: number;
  perPage: number;
}