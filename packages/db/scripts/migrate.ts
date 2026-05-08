import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

config({
    path: [
        "../../apps/web/.env.local",
        "../../apps/web/.env",
        "../../.env.local",
        "../../.env",
        ".env.local",
        ".env",
    ],
});

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to run migrations.");
}

const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
});

async function run(): Promise<void> {
    const db = drizzle(pool);

    await migrate(db, {
        migrationsFolder: "./drizzle",
    });
}

run()
    .then(() => {
        console.log("Migrations applied successfully.");
    })
    .catch((error) => {
        console.error("Migration run failed.");
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await pool.end();
    });
