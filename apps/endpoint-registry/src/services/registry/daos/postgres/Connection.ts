var pgConfig: any;
try {
  pgConfig = {
    host: process.env.CORE_REGISTRIES_ENDPOINTS_DATABASE_HOST,
    port: process.env.CORE_REGISTRIES_ENDPOINTS_DATABASE_PORT,
    user: process.env.CORE_REGISTRIES_ENDPOINTS_DATABASE_USER,
    password: process.env.CORE_REGISTRIES_ENDPOINTS_DATABASE_PASSWORD,
    database: process.env.CORE_REGISTRIES_ENDPOINTS_DATABASE_NAME,
    maxConnections: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  };
  console.log('Pgconfig is :' + JSON.stringify(pgConfig));
} catch (e) {
  throw new Error('Can not read PG environment variables.');
}

export { pgConfig };
