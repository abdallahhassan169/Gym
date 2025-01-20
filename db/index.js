import pg from "pg";

const pool = new pg.Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  schema: process.env.SCHEMA,
  port: 6543,
  ssl: { rejectUnauthorized: false },
});

export default pool;
