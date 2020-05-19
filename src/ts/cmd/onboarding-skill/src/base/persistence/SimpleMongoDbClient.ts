import mongodb, { MongoClient, Db, WriteOpResult } from 'mongodb';
import { IDatabaseClient } from '../persistenceinterface/IDatabaseClient';
import { IStateRecord } from '../persistenceinterface/IStateRecord';

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

  async deleteCurrentCollection() {
    if (!this.db) {
      throw new Error(
        'Attempting to use database without connecting to it first'
      );
    }
    return await this.db.collection(this.collectionName).drop();
  }

  async update(
    filter: any,
    fieldsToUpdate: any,
    newVersion: boolean
  ): Promise<WriteOpResult> {
    if (!this.db) {
      //TODO: check if this error is  caught and results in an unhandled rejection
      throw new Error(
        'Attempting to use database without connecting to it first'
      );
    }
    let updateObject = newVersion
      ? { $inc: { version: 1 }, $set: fieldsToUpdate }
      : { $set: fieldsToUpdate };
    //TODO: update is deprecated
    return await this.db
      .collection(this.collectionName)
      .update(filter, updateObject, { upsert: true });
  }

  async getOneByKey(filter: object): Promise<IStateRecord | null> {
    if (!this.db) {
      throw new Error(
        'Attempting to use database without connecting to it first'
      );
    }
    let result = await this.db
      .collection<IStateRecord>(this.collectionName)
      .findOne(filter);
    return result;
  }

  async disconnect() {
    if (!this.client) return;
    await this.client.close();
    this.connected = false;
  }
}

export { SimpleMongoDbClient };
