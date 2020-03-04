const { Pool } = require('pg');
import { pgConfig } from './Connection';
import { Registry } from './Registry';

class RegistryFactory {
  private static pool = new Pool(pgConfig);

  static async getRegistry(): Promise<Registry> {
    const client = RegistryFactory.getPool();
    //await client.connect();
    return new Registry(await client.connect());
  }

  static getPool() {
    console.log(pgConfig);
    return RegistryFactory.pool;
  }
}

export { RegistryFactory };
