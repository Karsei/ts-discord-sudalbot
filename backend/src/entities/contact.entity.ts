import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Guild } from './guild.entity';

@Entity('Contact')
export class Contact {
  @PrimaryGeneratedColumn('increment')
  idx!: number;

  @ManyToOne((type) => Guild, (guild) => guild.contact, { eager: false })
  @JoinColumn({ name: 'guild_id' })
  guild!: Guild;

  @Column({ name: 'user_id', length: 50, comment: '유저 ID', nullable: false })
  userId!: string;

  @Column({
    name: 'username',
    length: 256,
    comment: '유저 이름',
    nullable: false,
  })
  userName!: string;

  @Column({ name: 'summary', length: 4000, comment: '제목', nullable: false })
  summary!: string;

  @Column({ name: 'comment', length: 4000, comment: '내용', nullable: false })
  comment!: string;

  @CreateDateColumn({ name: 'created_at', comment: '생성일', nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '수정일', nullable: false })
  updatedAt!: Date;
}
