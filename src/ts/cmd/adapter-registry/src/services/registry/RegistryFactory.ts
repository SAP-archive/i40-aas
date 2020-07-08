import { Registry } from './AdapterRegistryLocal';

const logger = require('aas-logger/lib/log');

class RegistryFactory {
  static async getRegistryLocal(): Promise<Registry> {
    var storage = require('node-persist');

    await storage.init({dir: '../../etc/nodepersist/data', forgiveParseErrors: true, logging: true});
    logger.debug('Local storage initialized ');

    return new Registry(storage);
  }
}
export { RegistryFactory };
