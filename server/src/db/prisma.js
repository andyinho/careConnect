import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;

// Create a Postgres connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);

// Create Prisma Client with adapter (Prisma 7 requirement)
export const prisma = new PrismaClient({ adapter });
