const { Pool } = require('pg');
import { pgConfig } from './Connection';
import { Registry } from './Registry';

class RegistryFactory {
  static async getRegistry(): Promise<Registry> {
    const client = await this.getDbClient();
    return new Registry(client);
  }

  private static async getDbClient() {
    console.log(pgConfig);
    return await new Pool(pgConfig).connect();
  }
}

export { RegistryFactory };
