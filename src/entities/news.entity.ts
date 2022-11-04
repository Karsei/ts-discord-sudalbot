import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from 'typeorm';

import { YesNoFlag } from '../enums/common.enum';

@Entity('News')
export class News {
    @PrimaryGeneratedColumn('increment')
    id!: string;

    @Column({ name: 'guild_id', length: 50, comment: '서버 ID' })
    guildId: string;

    @Column({ name: 'locale', length: 8, comment: '언어', nullable: false })
    locale!: string;

    @Column({ name: 'type', length: 32, comment: '종류', nullable: false })
    type!: string;

    @Column({ name: 'url', length: 128, comment: '웹훅 주소', nullable: false })
    url!: string;

    @Column({ name: 'del_flag', type: 'enum', enum: YesNoFlag, comment: '삭제 여부', default: YesNoFlag.NO, nullable: false })
    delFlag!: YesNoFlag;

    @CreateDateColumn({ name: 'create_at', comment: '생성일', nullable: false })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'update_at', comment: '수정일', nullable: false })
    updatedAt!: Date;
}