import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PurchaseEngineService } from './purchase-engine.service';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [PurchaseEngineService],
  exports: [PurchaseEngineService],
})
export class PurchasesModule {}
