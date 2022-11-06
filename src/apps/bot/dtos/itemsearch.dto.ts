import { Param } from '@discord-nestjs/core';

import { Transform } from 'class-transformer';

export class ItemSearchDto {
    @Transform(({ value }) => value.toLowerCase())
    @Param({
        name: '이름',
        description:
            '아이템의 이름을 입력하세요.',
        required: true,
    })
    keyword: string;
}