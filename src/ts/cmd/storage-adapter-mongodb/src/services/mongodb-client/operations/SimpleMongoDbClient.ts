import mongodb, { MongoClient, Db, WriteOpResult } from 'mongodb';
import { IDatabaseClient } from './IDatabaseClient';

const logger = require('aas-logger/lib/log');

class SimpleMongoDbClient implements IDatabaseClient {
  private uri: string;
  private client: MongoClient | undefined;
  private db: Db | undefined;
  private connected: boolean = false;

  constructor(
    private collectionName: string,
    private dbName: string,
    private host: string,
    private port: string,
    private userName?: string,
    private password?: string,
    private authSource?: string
  ) {
    logger.info('Using database called ' + dbName);
    if (userName && password) {
      logger.info('Using authenticated access to db');
      this.uri =
        'mongodb://' +
        this.userName +
        ':' +
        this.password +
        '@' +
        this.host +
        ':' +
        this.port;
      if (authSource && authSource.length > 0) {
        logger.debug('Authentication DB:' + authSource);
        this.uri += '/?authSource=' + authSource;
      } else {
        logger.debug('Using default authentication DB');
      }
    } else {
      this.uri = 'mongodb://' + this.host + ':' + this.port;
    }
    let that = this;
    process.on('SIGINT', function () {
      that.disconnect();
    });
  }

  private getDb(): Db {
    if (!this.db) {
      throw new Error(
        'Attempting to use database without connecting to it first'
      );
    } else return this.db;
  }
  async connect() {
    {
      if (!this.connected) {
        this.connected = true;
        this.client = await mongodb.MongoClient.connect(this.uri, {
          useNewUrlParser: true,
        });
        this.db = this.client.db(this.dbName);
      }
    }
  }

  async deleteOne(filter: any) {
    let db = this.getDb();
    let result = await db.collection(this.collectionName).deleteOne(filter);
    if (result.deletedCount === 0) {
      throw new Error(
        'Items for filter ' + JSON.stringify(filter) + 'not found in DB'
      );
    }
  }

  async deleteCurrentCollection() {
    let db = this.getDb();
    return await db.collection(this.collectionName).drop();
  }

  async update(
    filter: any,
    fieldsToUpdate: any,
    newVersion: boolean
  ): Promise<WriteOpResult> {
    let db = this.getDb();
    let updateObject = newVersion
      ? { $inc: { version: 1 }, $set: fieldsToUpdate }
      : { $set: fieldsToUpdate };
    //TODO: update is deprecated
    return await db
      .collection(this.collectionName)
      .update(filter, updateObject, { upsert: true });
  }

  async getOneByKey(filter: object): Promise<any | null> {
    let db = this.getDb();
    let result = await db.collection(this.collectionName).findOne(filter);
    return result;
  }

  async getAll(): Promise<any[]> {
    let db = this.getDb();
    let result = await db.collection(this.collectionName).find().toArray();
    return result;
  }

  async disconnect() {
    if (!this.client) return;
    await this.client.close();
    this.connected = false;
  }
}

export { SimpleMongoDbClient };
