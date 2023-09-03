import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SaveWebhookDto {
  @IsString()
  code: string;
  @IsString()
  @IsOptional()
  state?: string;
  @IsString()
  guild_id: string;
  @IsNumber()
  permissions: number;
}
