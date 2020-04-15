const { Pool } = require('pg');
import { Registry } from './Registry';
import { DatabaseConnection } from './DatabaseConnection';
import { Connection, createConnection, getConnection } from 'typeorm';
import { logger } from '../../../../log';

class RegistryFactory {
  static async getRegistry(): Promise<Registry> {
    //try to get the db connection. The first time a request comes in this will fail
    //and a new connection will be established
    try {
      let client = getConnection();
      logger.debug('Client ' + client);
      return new Registry(client);
    } catch (error) {
      logger.error(
        'No database Connection could be established, will try reconnecting'
      );
      logger.error('Error:' + error);
      await this.createDBConnection();
      return new Registry(getConnection());
    }
  }

  static async createDBConnection() {
    //typeORM's Connection does not setup a database connection as it might seem, instead it sets up a connection pool
    // Generally, you must create connection only once in your application bootstrap, and close it after you completely finished working with the database. In practice, if you are building a backend for your site and your backend server always stays running - you never close a connection
    if (
      process.env.CORE_REGISTRIES_ENDPOINTS_DATABASE_HOST &&
      process.env.CORE_REGISTRIES_ENDPOINTS_DATABASE_PORT &&
      process.env.CORE_REGISTRIES_ENDPOINTS_DATABASE_USER &&
      process.env.CORE_REGISTRIES_ENDPOINTS_DATABASE_PASSWORD &&
      process.env.CORE_REGISTRIES_ENDPOINTS_DATABASE_NAME
    ) {
      var host = process.env.CORE_REGISTRIES_ENDPOINTS_DATABASE_HOST;
      var port: number = +process.env.CORE_REGISTRIES_ENDPOINTS_DATABASE_PORT;
      var username = process.env.CORE_REGISTRIES_ENDPOINTS_DATABASE_USER;
      var password = process.env.CORE_REGISTRIES_ENDPOINTS_DATABASE_PASSWORD;
      var database = process.env.CORE_REGISTRIES_ENDPOINTS_DATABASE_NAME;

      console.log('getting orm pg connection');

      var dbConn = new DatabaseConnection(
        host,
        port,
        username,
        password,
        database
      );
      return dbConn.connectDB();
    } else
      console.error(
        'One or more env. variables for the Postgres connection was not set'
      );
    return null;
  }
}
export { RegistryFactory };
