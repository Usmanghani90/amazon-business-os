// Local development Postgres, powered by `embedded-postgres`.
// A real Postgres server — no Docker, no admin rights. Data lives in ./.pgdata.
//   Start (keeps running):  node scripts/pg-server.mjs     (or: npm run db:start)
//   Connection string:      postgresql://postgres:postgres@localhost:5433/amazon_business_os
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";

const DATA_DIR = "./.pgdata";
const DB_NAME = "amazon_business_os";

const pg = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  user: "postgres",
  password: "postgres",
  port: 5433,
  persistent: true,
});

const isFresh = !existsSync(DATA_DIR);

if (isFresh) {
  console.log("Initialising Postgres cluster…");
  await pg.initialise();
}

await pg.start();
console.log("Postgres started on localhost:5433");

if (isFresh) {
  try {
    await pg.createDatabase(DB_NAME);
    console.log(`Created database "${DB_NAME}"`);
  } catch (err) {
    console.log(`createDatabase: ${err.message}`);
  }
}

console.log("READY — leave this process running while you develop.");

async function shutdown() {
  console.log("\nStopping Postgres…");
  try {
    await pg.stop();
  } finally {
    process.exit(0);
  }
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
