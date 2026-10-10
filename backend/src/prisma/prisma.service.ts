import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;
  private pool: pg.Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL || '';
    const pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });

    this.pool = pool;
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log('Successfully connected to Supabase PostgreSQL database via Prisma 7');
    } catch (error) {
      this.isConnected = false;
      this.logger.warn(
        `Failed to connect to PostgreSQL database: ${(error as Error).message}. ` +
        `Database features will require PostgreSQL to be running at ${process.env.DATABASE_URL}`,
      );
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.$disconnect();
      await this.pool.end();
      this.logger.log('Disconnected from PostgreSQL database');
    }
  }

  get isDbConnected(): boolean {
    return this.isConnected;
  }
}
