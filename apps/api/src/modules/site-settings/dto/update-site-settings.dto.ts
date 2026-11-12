import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

class SiteSettingEntryDto {
  @IsString()
  @MaxLength(128)
  key!: string;

  @IsString()
  @MaxLength(2000)
  value!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateSiteSettingsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SiteSettingEntryDto)
  settings!: SiteSettingEntryDto[];
}
