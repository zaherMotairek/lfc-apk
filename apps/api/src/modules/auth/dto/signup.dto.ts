import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class SignupDto {
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message: 'Username may only contain letters, numbers, dots, underscores and hyphens',
  })
  username!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
