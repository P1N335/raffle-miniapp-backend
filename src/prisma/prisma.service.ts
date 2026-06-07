import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool, type PoolConfig } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const pool = new Pool(buildPoolConfig());

    const adapter = new PrismaPg(pool);

    super({
      adapter,
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}

function buildPoolConfig(): PoolConfig {
  const poolConfig: PoolConfig = {
    connectionString: process.env.DATABASE_URL,
    statement_timeout: getOptionalIntEnv('DATABASE_STATEMENT_TIMEOUT_MS'),
    query_timeout: getOptionalIntEnv('DATABASE_QUERY_TIMEOUT_MS'),
    connectionTimeoutMillis: getOptionalIntEnv(
      'DATABASE_POOL_CONNECTION_TIMEOUT_MS',
    ),
    idleTimeoutMillis: getOptionalIntEnv('DATABASE_POOL_IDLE_TIMEOUT_MS'),
    max: getOptionalIntEnv('DATABASE_POOL_MAX'),
  };

  const ssl = getSslConfig();

  if (ssl) {
    poolConfig.ssl = ssl;
  }

  return poolConfig;
}

function getSslConfig() {
  const sslMode = process.env.DATABASE_SSL_MODE?.trim().toLowerCase();
  const sslEnabled = process.env.DATABASE_SSL?.trim().toLowerCase();

  if (sslMode === 'disable' || sslEnabled === 'false') {
    return undefined;
  }

  if (
    sslMode === 'require' ||
    sslMode === 'verify-ca' ||
    sslMode === 'verify-full' ||
    sslEnabled === 'true'
  ) {
    return {
      rejectUnauthorized: sslMode === 'verify-full' || sslMode === 'verify-ca',
    };
  }

  return undefined;
}

function getOptionalIntEnv(name: string) {
  const rawValue = process.env[name]?.trim();

  if (!rawValue) {
    return undefined;
  }

  const parsed = Number.parseInt(rawValue, 10);

  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return undefined;
}
