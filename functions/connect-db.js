const { Client } = require("pg"); // 'pg' is PostgreSQL client for Node.js

// This will be your Neon database connection URL
const DATABASE_URL = process.env.DATABASE_URL; // Store this URL in environment variables

export async function handler(event, context) {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    const res = await client.query("SELECT NOW()");
    console.log(res.rows); // This will log the current timestamp from Neon DB
    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Database connected successfully!",
        timestamp: res.rows[0].now, // Display the time from DB
      }),
    };
  } catch (err) {
    console.error("Error connecting to Neon DB:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Database connection failed" }),
    };
  }
}
