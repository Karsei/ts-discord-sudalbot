import {
  NewsCategoryGlobal,
  NewsCategoryKorea,
  NewsContent,
} from '../../../definitions/interface/archive';

export interface NewsArchiveUseCase {
  /**
   * 글로벌 서비스의 특정 카테고리의 소식을 조회합니다.
   * @param type 카테고리
   * @param locale 언어
   * @param isSkipCache Cache 사용 여부
   */
  getGlobal(
    type: NewsCategoryGlobal,
    locale: string,
    isSkipCache: boolean,
  ): Promise<NewsContent[]>;

  /**
   * 글로벌 서비스의 모든 카테고리 소식을 조회합니다.
   * @param locale
   */
  getGlobalAll(locale: string): Promise<any[]>;

  /**
   * 한국 서비스의 특정 카테고리 소식을 조회합니다.
   * @param type 카테고리
   * @param isSkipCache Cache 사용 여부
   */
  getKorea(
    type: NewsCategoryKorea,
    isSkipCache: boolean,
  ): Promise<NewsContent[]>;

  /**
   * 한국 서비스의 모든 카테고리 소식을 조회합니다.
   */
  getKoreaAll(): Promise<any[]>;
}

export const NewsArchiveUseCaseToken = Symbol('NewsArchiveUseCase');
