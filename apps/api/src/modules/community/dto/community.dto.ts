import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class RegisterEventDto {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  joinWaitlist?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2)
  guestCount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  guestNames?: string;
}

export class AddNewsCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content!: string;
}

export class AdminPushBroadcastDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  body!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  url?: string;
}

export class SetNewsReactionDto {
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  reactionType!: string;
}

export class UpdateNotificationReadDto {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isRead?: boolean;
}

