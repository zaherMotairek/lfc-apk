import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { MembershipPackageType } from '@prisma/client';

export class SubmitMembershipApplicationDto {
  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(3)
  address!: string;

  @IsString()
  @MinLength(5)
  phoneNumber!: string;

  @IsEnum(MembershipPackageType)
  packageType!: MembershipPackageType;

  @IsOptional()
  @IsString()
  previousOlscId?: string;

  @IsBoolean()
  isOfficialLfcMember!: boolean;

  @ValidateIf((dto: SubmitMembershipApplicationDto) => dto.isOfficialLfcMember)
  @IsString()
  @MinLength(1)
  lfcId?: string;

  @IsBoolean()
  paymentAgreed!: boolean;
}
