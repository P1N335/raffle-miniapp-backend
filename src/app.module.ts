import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { resolve } from 'node:path';
import { AuditModule } from './audit/audit.module';
import { AdminModule } from './admin/admin.module';
import { AuthSessionGuard } from './auth/auth-session.guard';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CasesModule } from './cases/cases.module';
import { WithdrawalsModule } from './withdrawals/withdrawals.module';
import { CoinflipModule } from './coinflip/coinflip.module';
import { PurchasesModule } from './purchases/purchases.module';
import { RateLimitGuard } from './security/rate-limit.guard';

const envFilePaths = [
  resolve(process.cwd(), '.env'),
  resolve(__dirname, '../.env'),
  resolve(__dirname, '../../.env'),
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: envFilePaths,
    }),
    PrismaModule,
    AuditModule,
    PurchasesModule,
    UsersModule,
    AuthModule,
    CasesModule,
    WithdrawalsModule,
    CoinflipModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthSessionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule {}
