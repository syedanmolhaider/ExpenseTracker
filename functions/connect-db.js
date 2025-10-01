const { Client } = require("pg"); // PostgreSQL client for Node.js

// Neon/DB connection URL must be provided in the environment
const DATABASE_URL = process.env.DATABASE_URL;

// Ensure the function uses CommonJS export for Netlify functions
module.exports.handler = async function (event, context) {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();

    // Ensure logs table exists
    await client.query(
      `CREATE TABLE IF NOT EXISTS logs (
        id SERIAL PRIMARY KEY,
        event_type TEXT NOT NULL,
        payload JSONB,
        created_at TIMESTAMPTZ DEFAULT now()
      );`
    );

    if (event.httpMethod === "GET") {
      // Return all logs ordered by creation time (ascending)
      const res = await client.query(
        `SELECT id, event_type, payload, created_at FROM logs ORDER BY created_at ASC`
      );
      await client.end();
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(res.rows),
      };
    }

    if (event.httpMethod === "POST") {
      // Expect body to contain { event_type, payload }
      let body = event.body || "";
      try {
        body = JSON.parse(body);
      } catch (err) {
        // If body isn't JSON, return error
        await client.end();
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Invalid JSON body" }),
        };
      }

      const eventType = body.event_type || body.action || "app_event";
      const payload = body.payload || body;

      const insertRes = await client.query(
        `INSERT INTO logs (event_type, payload) VALUES ($1, $2) RETURNING id, event_type, payload, created_at`,
        [eventType, payload]
      );
      await client.end();
      return {
        statusCode: 201,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(insertRes.rows[0]),
      };
    }

    // Method not allowed
    await client.end();
    return {
      statusCode: 405,
      headers: { Allow: "GET, POST" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  } catch (err) {
    console.error("connect-db function error:", err);
    try {
      await client.end();
    } catch (e) {
      // ignore
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
