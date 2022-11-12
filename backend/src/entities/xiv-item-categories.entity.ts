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

@Entity('XivItemCategories')
export class XivItemCategories {
    @PrimaryGeneratedColumn('increment')
    idx!: number;

    @ManyToOne(
        (type) => XivVersion,
        (version) => version.itemCategories,
        { nullable: false, eager: true }
    )
    @JoinColumn({ name: 'version_ref_idx' })
    version: XivVersion;

    @Column({ name: 'item_category_idx', comment: '아이템 카테고리 ID', nullable: false })
    itemCategoryIdx: number;

    @Column({ name: 'name', length: 512, comment: '아이템 카테고리 이름', nullable: false })
    name: string;

    @Column({ name: 'content', type: 'longtext', comment: '아이템 카테고리 설명' })
    content: string;

    @CreateDateColumn({ name: 'created_at', comment: '생성일', nullable: false })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at', comment: '수정일', nullable: false })
    updatedAt!: Date;
}