import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateContentOverrideDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  key!: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  language?: string;

  @IsString()
  @MaxLength(4000)
  value!: string;
}
