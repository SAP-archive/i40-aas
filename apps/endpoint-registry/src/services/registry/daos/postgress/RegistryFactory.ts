const { Pool } = require('pg');
const genericPool = require('generic-pool');
import { pgConfig } from './Connection';
import { Registry } from './Registry';

class RegistryFactory {
  static pool: any = new Pool(pgConfig);
  static async getRegistry(): Promise<Registry> {
    const client = await this.pool.connect();
    return new Registry(client);
  }
}
export { RegistryFactory };
