var pgConfig: any;
try {
  pgConfig = {
    host: process.env.ENDPOINT_REGISTRY_POSTGRES_HOST,
    port: process.env.ENDPOINT_REGISTRY_POSTGRES_PORT,
    user: process.env.ENDPOINT_REGISTRY_POSTGRES_USER,
    password: process.env.ENDPOINT_REGISTRY_POSTGRES_PASSWORD,
    database: process.env.ENDPOINT_REGISTRY_POSTGRES_DB,
    maxConnections: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  };
  console.log('Pgconfig is :' + JSON.stringify(pgConfig));
} catch (e) {
  throw new Error('Can not read PG environment variables.');
}

export { pgConfig };
