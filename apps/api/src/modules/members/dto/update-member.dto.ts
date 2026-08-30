import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateMemberDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  favoritePlayer?: string;

  @IsOptional()
  @IsString()
  olscId?: string;

  @IsOptional()
  @IsString()
  lfcId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  officialMemberId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  seasonLabel?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
