import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from 'typeorm';

@Entity('Guild')
export class Guild {
    @PrimaryGeneratedColumn('increment')
    id!: string;

    @Column({ name: 'guild_id', length: 50, comment: '서버 ID' })
    guildId: string;

    @Column({ name: 'name', length: 256, comment: '이름' })
    name: string;

    @Column({ name: 'webhook_id', length: 64, comment: '웹훅 ID' })
    webhookId: string;

    @Column({ name: 'webhook_token', length: 128, comment: '웹훅 Token' })
    webhookToken: string;

    @Column({ name: 'webhook_channel_id', length: 128, comment: '웹훅 채널 ID' })
    webhookChannelId: string;

    @Column({ name: 'webhook_url', length: 256, comment: '웹훅 채널 ID', nullable: false })
    webhookUrl!: string;

    @CreateDateColumn({ name: 'create_at', comment: '생성일', nullable: false })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'update_at', comment: '수정일', nullable: false })
    updatedAt!: Date;
}