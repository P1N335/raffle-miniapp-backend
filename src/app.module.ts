import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'node:path';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { RaffleModule } from './raffle/raffle.module';
import { AuthModule } from './auth/auth.module';
import { CasesModule } from './cases/cases.module';
import { WithdrawalsModule } from './withdrawals/withdrawals.module';

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
    UsersModule,
    RaffleModule,
    AuthModule,
    CasesModule,
    WithdrawalsModule,
  ],
})
export class AppModule {}
