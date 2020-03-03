const { Pool } = require('pg');
import { pgConfig } from './Connection';
import pgPromise from 'pg-promise';
import { Registry } from './Registry';
const pgp = pgPromise({});

class RegistryFactory {
  static readonly db: pgPromise.IDatabase<{}> = pgp({
    host: pgConfig.host,
    port: pgConfig.port,
    database: pgConfig.database,
    user: pgConfig.user,
    password: pgConfig.password,
    max: pgConfig.maxConnections,
    idleTimeoutMillis: pgConfig.idleTimeoutMillis,
    connectionTimeoutMillis: pgConfig.connectionTimeoutMillis
  });

  static pool: any = new Pool(pgConfig);

  static async getRegistry(): Promise<Registry> {
    const client = await this.getDbClient();
    return new Registry(client);
  }

  static async getRegistryNew(): Promise<Registry> {
    return new Registry(RegistryFactory.db);
  }

  private static async getDbClient() {
    console.log(pgConfig);
    return await this.pool.connect();
  }
}

export { RegistryFactory };
