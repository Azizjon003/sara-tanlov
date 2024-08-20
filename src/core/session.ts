const PostgresSession = require("telegraf-postgres-session");
// const session = memorySession({});

const session = new PostgresSession({
  connectionString: process.env.SESSION_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default session;
