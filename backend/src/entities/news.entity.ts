import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { YesNoFlag } from '../definitions/common.enum';
import { Guild } from './guild.entity';

@Entity('News')
export class News {
  @PrimaryGeneratedColumn('increment')
  idx!: number;

  @ManyToOne((type) => Guild, (guild) => guild.news, { eager: false })
  @JoinColumn({ name: 'guild_id' })
  guild: Guild;

  @Column({ name: 'locale', length: 8, comment: '언어', nullable: false })
  locale!: string;

  @Column({ name: 'type', length: 32, comment: '종류', nullable: false })
  type!: string;

  @Column({ name: 'url', length: 128, comment: '웹훅 주소', nullable: false })
  url!: string;

  @Column({
    name: 'del_flag',
    type: 'enum',
    enum: YesNoFlag,
    comment: '삭제 여부',
    default: YesNoFlag.NO,
    nullable: false,
  })
  delFlag!: YesNoFlag;

  @CreateDateColumn({ name: 'created_at', comment: '생성일', nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '수정일', nullable: false })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', comment: '삭제일', nullable: true })
  deletedAt: Date;
}
