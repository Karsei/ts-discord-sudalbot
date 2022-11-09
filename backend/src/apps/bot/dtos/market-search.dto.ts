import { Param } from '@discord-nestjs/core';

import { Transform } from 'class-transformer';

export class MarketSearchDto {
    @Transform(({ value }) => value.toLowerCase())
    @Param({
        name: '서버',
        description:
            '서버 이름을 입력하세요.',
        required: true,
    })
    server: string;

    @Transform(({ value }) => value.toLowerCase())
    @Param({
        name: '아이템이름',
        description:
            '아이템의 이름을 입력하세요.',
        required: true,
    })
    keyword: string;
}