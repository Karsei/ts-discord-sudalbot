import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { YesNoFlag } from '../definitions/common.type';
import { News } from './news.entity';
import { Contact } from './contact.entity';

@Entity('Guild')
export class Guild {
  @PrimaryColumn({ name: 'id', length: 50, comment: '서버 ID' })
  id: string;

  @Column({ name: 'name', length: 256, comment: '이름' })
  name: string;

  @Column({ name: 'webhook_id', length: 64, comment: '웹훅 ID' })
  webhookId: string;

  @Column({ name: 'webhook_token', length: 128, comment: '웹훅 Token' })
  webhookToken: string;

  @Column({ name: 'webhook_channel_id', length: 128, comment: '웹훅 채널 ID' })
  webhookChannelId: string;

  @Column({
    name: 'webhook_url',
    length: 256,
    comment: '웹훅 채널 ID',
    nullable: false,
  })
  webhookUrl!: string;

  @Column({
    name: 'active',
    comment: '활성 여부',
    default: true,
    nullable: false,
  })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at', comment: '생성일', nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '수정일', nullable: false })
  updatedAt!: Date;

  @OneToMany((type) => News, (news) => news.guild, { eager: false })
  news: News[];

  @OneToMany((type) => Contact, (contact) => contact.guild, { eager: false })
  contact: Contact[];
}
