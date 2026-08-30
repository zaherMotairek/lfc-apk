import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

class ImportMemberItemDto {
  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsString()
  @MinLength(1)
  officialMemberId!: string;

  @IsString()
  @MinLength(1)
  seasonLabel!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ImportMembersDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ImportMemberItemDto)
  members!: ImportMemberItemDto[];

  @IsOptional()
  @IsBoolean()
  sendInvitations?: boolean;
}
