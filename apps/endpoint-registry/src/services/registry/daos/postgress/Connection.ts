var pgConfig: object;
try {
  pgConfig = {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    maxConnections: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  };
  console.log(pgConfig);
} catch (e) {
  throw new Error('Can not read PG environment variables.');
}

export { pgConfig };
