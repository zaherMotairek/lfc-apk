import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  lastName?: string;

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
  avatarUrl?: string;
}
