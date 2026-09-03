import { IsEnum, IsOptional, IsString } from 'class-validator';
import { MembershipApplicationStatus } from '@prisma/client';

export class UpdateMembershipApplicationDto {
  @IsOptional()
  @IsEnum(MembershipApplicationStatus)
  status?: MembershipApplicationStatus;

  @IsOptional()
  @IsString()
  assignedOlscId?: string;

  @IsOptional()
  @IsString()
  adminNotes?: string;
}
