import { Choice, Param } from '@discord-nestjs/core';

import { Locales } from '../../../enums/common.enum';

export class NoticeManageDto {
    @Choice(Locales)
    @Param({
        name: '언어',
        description:
            '언어를 입력하세요.',
        required: true,
    })
    locale: Locales;
}