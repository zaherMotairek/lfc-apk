import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterEventDto {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  joinWaitlist?: boolean;
}

export class AddNewsCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content!: string;
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

