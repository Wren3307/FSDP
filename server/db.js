// Shared PostgreSQL connection pool for the API.
//
// Loads server/.env relative to this file, so the API behaves the same whether
// it is started from server/ or from the repository root.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

const serverDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(serverDir, '.env') });

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Copy server/.env.example to server/.env and fill it in.',
  );
}

export const pool = new pg.Pool({ connectionString: DATABASE_URL });
