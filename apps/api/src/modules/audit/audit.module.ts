import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditListService } from './audit-list.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AuditController],
  providers: [AuditListService],
})
export class AuditModule {}
