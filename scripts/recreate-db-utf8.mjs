// One-off: recreate the app database as UTF8 (embedded initdb defaults to the
// Windows locale/WIN1252, which can't store non-Latin currency symbols).
import pg from "pg";

const client = new pg.Client({
  host: "localhost",
  port: 5433,
  user: "postgres",
  password: "postgres",
  database: "postgres",
});

await client.connect();
// Drop existing connections then recreate as UTF8 from the pristine template0.
await client.query(`
  SELECT pg_terminate_backend(pid) FROM pg_stat_activity
  WHERE datname = 'amazon_business_os' AND pid <> pg_backend_pid();
`);
await client.query(`DROP DATABASE IF EXISTS amazon_business_os;`);
await client.query(
  `CREATE DATABASE amazon_business_os TEMPLATE template0 ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C';`,
);
console.log("Recreated amazon_business_os as UTF8");
await client.end();
