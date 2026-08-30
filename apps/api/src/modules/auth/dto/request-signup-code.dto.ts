import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RequestSignupCodeDto {
  @IsEmail()
  email!: string;
}
