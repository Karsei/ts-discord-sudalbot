import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Guild } from './guild.entity';

@Entity('FashionCheckNotice')
export class FashionCheckNotice {
  @PrimaryGeneratedColumn('increment')
  idx!: number;

  @ManyToOne((type) => Guild, (guild) => guild.news, { eager: false })
  @JoinColumn({ name: 'guild_id' })
  guild: Guild;

  @Column({ name: 'webhook_id', length: 64, comment: '웹훅 ID' })
  webhookId: string;

  @Column({ name: 'webhook_token', length: 128, comment: '웹훅 Token' })
  webhookToken: string;

  @Column({ name: 'webhook_channel_id', length: 128, comment: '웹훅 채널 ID' })
  webhookChannelId: string;

  @CreateDateColumn({ name: 'created_at', comment: '생성일', nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '수정일', nullable: false })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', comment: '삭제일', nullable: true })
  deletedAt: Date;
}
