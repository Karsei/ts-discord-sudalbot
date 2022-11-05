import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from 'typeorm';

import { XivVersion } from './xiv-version.entity';

@Entity('XivItem')
export class XivItem {
    @PrimaryGeneratedColumn('increment')
    idx!: number;

    @ManyToOne(
        (type) => XivVersion,
        (version) => version.items,
        { nullable: false, eager: false }
    )
    @JoinColumn({ name: 'version_idx' })
    version: XivVersion;

    @Column({ name: 'item_idx', comment: '아이템 ID', nullable: false })
    itemIdx: number;

    @Column({ name: 'name', length: 512, comment: '아이템 이름', nullable: false })
    name: string;

    @Column({ name: 'content', type: 'longtext', comment: '아이템 설명' })
    content: string;

    @CreateDateColumn({ name: 'created_at', comment: '생성일', nullable: false })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at', comment: '수정일', nullable: false })
    updatedAt!: Date;
}