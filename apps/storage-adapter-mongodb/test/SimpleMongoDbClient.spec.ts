import { fail } from "assert";
import { logger } from "../src/log";
import { SimpleMongoDbClient } from "../src/services/mongodb-client/operations/SimpleMongoDbClient";
import { ISubmodelRecord } from "../src/services/mongodb-client/model/ISubmodelRecord";

var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

// Then either:
var expect = chai.expect;
// or:
//var assert = chai.assert;
// or:
chai.should();

describe("SimpleMongoDbClient", function() {
  const uuidv1 = require("uuid/v1");
  let mongoDbClient: SimpleMongoDbClient;
  let collectionName: string = "tests" + uuidv1();

  before(async () => {
    if (
      !process.env.MONGODB_HOST ||
      !process.env.MONGODB_PORT ||
      !process.env.MONGO_INITDB_DATABASE
    ) {
      throw new Error(
        "These environment variables need to be set: MONGODB_HOST, MONGODB_PORT, MONGO_INITDB_DATABASE"
      );
    }
    if (
      process.env.MONGO_INITDB_ROOT_USERNAME &&
      process.env.MONGO_INITDB_ROOT_PASSWORD
    ) {
      logger.info("Using authentication");
    }
    mongoDbClient = new SimpleMongoDbClient(
      collectionName,
      process.env.MONGO_INITDB_DATABASE,
      process.env.MONGODB_HOST,
      process.env.MONGO_INITDB_DATABASE,
      process.env.MONGO_INITDB_ROOT_USERNAME,
      process.env.MONGO_INITDB_ROOT_PASSWORD
    );
    await mongoDbClient.connect();
  });
  after(async () => {
    try {
      await mongoDbClient.deleteCurrentCollection();
      await mongoDbClient.disconnect();
    } catch (error) {
      logger.error("Error cleaning up:" + error);
    }
  });
  beforeEach(async () => {});

  afterEach(async () => {});

  it("stores and reads", async function() {
    await mongoDbClient.connect();
    let submodelRecord: ISubmodelRecord = {
      _id: "ASDS-KLKD-POPF-TDGF",
      serializedSubmodel: "submodel",
      version: 0
    };
    await mongoDbClient.update(
      { _id: submodelRecord._id },
      { serializedSubmodel: submodelRecord.serializedSubmodel },
      true
    );
    let result: ISubmodelRecord | null = await mongoDbClient.getOneByKey({
      _id: submodelRecord._id
    });
    if (!result) {
      fail("Error");
      return;
    }
    expect(result.serializedSubmodel).to.be.equal(
      submodelRecord.serializedSubmodel
    );
  });
  it("provides optimistic locking", async function() {
    const uuidv1 = require("uuid/v1");
    const uuid: string = uuidv1();

    let stateRecord: any = {
      _id: uuid,
      serializedState: "WaitingForOnboardingRequestOLTest"
    };
    await mongoDbClient.update(
      { _id: stateRecord._id, version: 0 },
      { serializedState: stateRecord.serializedState },
      true
    );
    let result: ISubmodelRecord | null = await mongoDbClient.getOneByKey({
      _id: stateRecord._id
    });
    if (result) logger.info("Version in DB:" + result.version);
    await mongoDbClient.update(
      { _id: stateRecord._id, version: 1 },
      { serializedState: stateRecord.serializedState },
      true
    );
    result = await mongoDbClient.getOneByKey({
      _id: stateRecord._id
    });
    if (result) logger.info("Version in DB:" + result.version);
    const promiseToFail = mongoDbClient.update(
      { _id: stateRecord._id, version: 0 },
      { serializedState: stateRecord.serializedState },
      true
    );
    try {
      await promiseToFail;
    } catch (error) {
      logger.info(error);
      expect(error)
        .to.have.property("errmsg")
        .that.includes("E11000 duplicate key error");
      return;
    }

    fail("Error");
  });
});
