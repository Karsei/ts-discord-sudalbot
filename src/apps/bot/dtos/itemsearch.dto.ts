import { Param } from '@discord-nestjs/core';

export class ItemSearchDto {
    @Param({
        name: '이름',
        description:
            '아이템의 이름을 입력하세요.',
        required: true,
    })
    keyword: string;
}