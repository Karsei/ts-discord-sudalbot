import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Guild } from './guild.entity';

@Entity('Chat')
export class Chat {
  @PrimaryGeneratedColumn('increment')
  idx!: number;

  @ManyToOne((type) => Guild, (guild) => guild.news, { eager: false })
  @JoinColumn({ name: 'guild_id' })
  guild: Guild;

  @Column({
    name: 'guild_name',
    length: 128,
    comment: '서버 이름',
    nullable: true,
  })
  guildName!: string;

  @Column({
    name: 'member_id',
    length: 64,
    comment: '멤버 ID',
    nullable: false,
  })
  userId!: string;

  @Column({
    name: 'member_name',
    length: 128,
    comment: '멤버 이름',
    nullable: true,
  })
  userName!: string;

  @Column({ name: 'content', comment: '내용', nullable: true, type: 'text' })
  content!: string;

  @CreateDateColumn({ name: 'created_at', comment: '생성일', nullable: false })
  createdAt!: Date;
}
