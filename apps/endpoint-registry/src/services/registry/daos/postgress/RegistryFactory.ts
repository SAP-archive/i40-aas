const { Pool } = require('pg');
const genericPool = require('generic-pool');
import { pgConfig } from './Connection';
import { Registry } from './Registry';

class RegistryFactory {
  static pool: any = new Pool(pgConfig);

  static async getRegistry(): Promise<Registry> {
    const client = await this.getDbClient();
    return new Registry(client);
  }
  static async getDbClient() {
    console.log(pgConfig);
    return await this.pool.connect();
  }
}
export { RegistryFactory };
