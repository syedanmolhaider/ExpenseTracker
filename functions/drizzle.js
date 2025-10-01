import { drizzle } from "drizzle-orm";
import { Client } from "pg";

// Get the connection string from the environment variable
const DATABASE_URL = process.env.NETLIFY_DATABASE_URL;

// Create a new instance of the PostgreSQL client
const client = new Client({
  connectionString: DATABASE_URL, // Use Neon database URL
});

client.connect();

// Now, use drizzle to create a database client
const db = drizzle(client);

export default db;
