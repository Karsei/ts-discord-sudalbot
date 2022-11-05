import {
    Column,
    CreateDateColumn,
    Entity,
    Unique,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from 'typeorm';

import { XivItem } from './xiv-item.entity';
import { XivItemCategories } from './xiv-item-categories.entity';

@Entity('XivVersion')
@Unique(['version', 'locale'])
export class XivVersion {
    @PrimaryGeneratedColumn('increment')
    idx!: number;

    @Column({ type: 'decimal', precision: 5, scale: 3, name: 'version', comment: '클라이언트 버전', nullable: false })
    version!: number;

    @Column({ name: 'locale', length: 2, comment: '언어', nullable: false })
    locale!: string;

    @CreateDateColumn({ name: 'created_at', comment: '생성일', nullable: false })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at', comment: '수정일', nullable: false })
    updatedAt!: Date;

    @OneToMany(
        (type) => XivItem,
        (item) => item.version
    )
    items: XivItem[];

    @OneToMany(
        (type) => XivItemCategories,
        (itemCategories) => itemCategories.version
    )
    itemCategories: XivItemCategories[];
}