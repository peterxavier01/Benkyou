import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./schema";

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
    throw new Error(
        "DATABASE_URL is required to initialize the database client.",
    );
}

export const db = drizzle(databaseUrl, { schema });
