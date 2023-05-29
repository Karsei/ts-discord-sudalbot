type LocaleCategory =
{
    [index: string]: LocaleContent,
    'na': LocaleContent,
    'jp': LocaleContent,
    'eu': LocaleContent,
    'de': LocaleContent,
    'fr': LocaleContent,
    'kr': LocaleContent
}
interface LocaleContent
{
    name: string
}

export const Locales: LocaleCategory = {
    'na': {
        name: '미국(영어)'
    },
    'jp': {
        name: '일본(일본어)'
    },
    'eu': {
        name: '유럽(영어)'
    },
    'de': {
        name: '독일(독일어)'
    },
    'fr': {
        name: '프랑스(프랑스어)'
    },
    'kr': {
        name: '대한민국(한국어)'
    }
};

type NotifyCategory = {
    [index: string]: NotifyCategoryContent,
    'topics': NotifyCategoryContent,
    'notices': NotifyCategoryContent,
    'maintenance': NotifyCategoryContent,
    'updates': NotifyCategoryContent,
    'status': NotifyCategoryContent,
    'developers': NotifyCategoryContent,
    'event': NotifyCategoryContent,
    'patchnote': NotifyCategoryContent
}
interface NotifyCategoryContent
{
    name: string
}

export const NotifyCategory: NotifyCategory = {
    topics: {
        name: '토픽'
    },
    notices: {
        name: '공지'
    },
    maintenance: {
        name: '점검'
    },
    updates: {
        name: '업데이트'
    },
    status: {
        name: '서버 상태'
    },
    developers: {
        name: '개발자 노트'
    },
    event: {
        name: '이벤트'
    },
    patchnote: {
        name: '패치 노트'
    }
}