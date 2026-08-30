import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class VerifyCardDto {
  @IsString()
  token!: string;

  @IsOptional()
  @IsString()
  eventId?: string;
}

export class InviteMemberDto {
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
