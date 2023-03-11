export interface NewsCategoryGlobalF {
  topics: NewsCategoryContents;
  notices: NewsCategoryContents;
  maintenance: NewsCategoryContents;
  updates: NewsCategoryContents;
  status: NewsCategoryContents;
  developers: NewsCategoryContents;
}

export interface NewsCategoryKoreaF {
  notices: NewsCategoryContents;
  maintenance: NewsCategoryContents;
  updates: NewsCategoryContents;
  event: NewsCategoryContents;
  patchnote: NewsCategoryContents;
}

export interface NewsCategoryContents {
  category: string;
  name: string;
  url: string;
  link: string;
  icon: string;
  color: number;
  thumbnail?: string;
}

export interface NewsCategoryF {
  Global: NewsCategoryGlobalF;
  Korea: NewsCategoryKoreaF;
}

export enum NewsCategoryGlobal {
  topics = 'topics',
  notices = 'notices',
  maintenance = 'maintenance',
  updates = 'updates',
  status = 'status',
  developers = 'developers',
}

export enum NewsCategoryKorea {
  notices = 'notices',
  maintenance = 'maintenance',
  updates = 'updates',
  event = 'event',
  patchnote = 'patchnote',
}

const Categories: NewsCategoryF = {
  Global: {
    topics: {
      category: '토픽',
      name: 'Topics',
      url: '/lodestone/topics',
      link: '/lodestone/topics',
      icon: 'http://na.lodestonenews.com/images/topics.png',
      thumbnail: 'http://na.lodestonenews.com/images/thumbnail.png',
      color: 14258475,
    },
    notices: {
      category: '공지',
      name: 'Notices',
      url: '/lodestone/news/category/1',
      link: '/lodestone/news/category/1',
      icon: 'http://na.lodestonenews.com/images/notices.png',
      color: 13421772,
    },
    maintenance: {
      category: '점검',
      name: 'Maintenance',
      url: '/lodestone/news/category/2',
      link: '/lodestone/news/category/2',
      icon: 'http://na.lodestonenews.com/images/maintenance.png',
      color: 13413161,
    },
    updates: {
      category: '업데이트',
      name: 'Updates',
      url: '/lodestone/news/category/3',
      link: '/lodestone/news/category/3',
      icon: 'http://na.lodestonenews.com/images/updates.png',
      color: 7051581,
    },
    status: {
      category: '서버 상태',
      name: 'Status',
      url: '/lodestone/news/category/4',
      link: '/lodestone/news/category/4',
      icon: 'http://na.lodestonenews.com/images/status.png',
      color: 10042685,
    },
    developers: {
      category: '개발자 노트',
      name: `Developers' Blog`,
      url: '/pr/blog/atom.xml',
      link: '/pr/blog/',
      icon: 'http://na.lodestonenews.com/images/developers.png',
      color: 6737151,
    },
  },
  Korea: {
    notices: {
      category: '공지',
      name: '공지',
      url: '/news/notice?category=1',
      link: '/news/notice?category=1',
      icon: 'http://na.lodestonenews.com/images/notices.png',
      color: 13421772,
    },
    maintenance: {
      category: '점검',
      name: '점검',
      url: '/news/notice?category=2',
      link: '/news/notice?category=2',
      icon: 'http://na.lodestonenews.com/images/maintenance.png',
      color: 13413161,
    },
    updates: {
      category: '업데이트',
      name: '업데이트',
      url: '/news/notice?category=3',
      link: '/news/notice?category=3',
      icon: 'http://na.lodestonenews.com/images/updates.png',
      color: 7051581,
    },
    // 색과 아이콘 수정해야함
    event: {
      category: '이벤트',
      name: '이벤트',
      url: '/news/event',
      link: '/news/event',
      icon: 'http://na.lodestonenews.com/images/developers.png',
      color: 6737151,
    },
    patchnote: {
      category: '업데이트 노트',
      name: '업데이트 노트',
      url: '/news/patchnote',
      link: '/news/patchnote',
      icon: 'http://na.lodestonenews.com/images/developers.png',
      color: 6737151,
    },
  },
};

export const LodestoneLocales = ['na', 'jp', 'eu', 'de', 'fr'];

export interface NewsContent {
  idx: string;
  url: string;
  title: string;
  timestamp?: number;
  description?: string;
  thumbnail?: string;
  summary?: string;
}

export interface PaginationParams {
  page: number;
  perPage: number;
}

export default Categories;
