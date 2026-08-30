import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { NewsStatus } from '@prisma/client';

export class CreateNewsDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @MinLength(1)
  slug!: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsString()
  @MinLength(1)
  content!: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsEnum(NewsStatus)
  status?: NewsStatus;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  publishedAt?: Date;
}

export class UpdateNewsDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  slug?: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsEnum(NewsStatus)
  status?: NewsStatus;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  publishedAt?: Date;
}

export class CreateEventDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsString()
  @MinLength(1)
  location!: string;

  @Type(() => Date)
  @IsDate()
  startDateTime!: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDateTime?: Date;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDateTime?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDateTime?: Date;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  registrationOpen?: boolean;
}

export class CreateMediaAlbumDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;
}

export class CreateMediaAssetDto {
  @IsString()
  @MinLength(1)
  url!: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  albumId?: string;

  @IsOptional()
  @IsString()
  type?: 'IMAGE' | 'VIDEO';
}
