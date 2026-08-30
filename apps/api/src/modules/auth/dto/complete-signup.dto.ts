import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CompleteSignupDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;

  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  olscId?: string;

  @IsOptional()
  @IsString()
  lfcId?: string;
}
