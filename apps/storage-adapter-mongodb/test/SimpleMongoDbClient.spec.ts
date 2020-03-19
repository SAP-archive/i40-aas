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

function checkEnvVar(variableName: string): string {
  let retVal: string | undefined = process.env[variableName];
  if (retVal) {
    return retVal;
  } else {
    throw new Error(
      "A variable that is required by the skill has not been defined in the environment:" +
        variableName
    );
  }
}

describe("SimpleMongoDbClient", function() {
  const uuidv1 = require("uuid/v1");
  let mongoDbClient: SimpleMongoDbClient;
  let collectionName: string = "tests" + uuidv1();
  let APPLICATION_ADAPTERS_MONGODB_DATABASE_NAME = checkEnvVar("APPLICATION_ADAPTERS_MONGODB_DATABASE_NAME");
  let APPLICATION_ADAPTERS_MONGODB_DATABASE_HOST = checkEnvVar("APPLICATION_ADAPTERS_MONGODB_DATABASE_HOST");
  let APPLICATION_ADAPTERS_MONGODB_DATABASE_PORT = checkEnvVar("APPLICATION_ADAPTERS_MONGODB_DATABASE_PORT");
  let APPLICATION_ADAPTERS_MONGODB_DATABASE_USER = checkEnvVar("APPLICATION_ADAPTERS_MONGODB_DATABASE_USER");
  let APPLICATION_ADAPTERS_MONGODB_DATABASE_PASSWORD = checkEnvVar("APPLICATION_ADAPTERS_MONGODB_DATABASE_PASSWORD");

  if (APPLICATION_ADAPTERS_MONGODB_DATABASE_USER && APPLICATION_ADAPTERS_MONGODB_DATABASE_PASSWORD) {
    logger.info("Using authentication");
  }

  before(async () => {
    mongoDbClient = new SimpleMongoDbClient(
      collectionName,
      APPLICATION_ADAPTERS_MONGODB_DATABASE_NAME,
      APPLICATION_ADAPTERS_MONGODB_DATABASE_HOST,
      APPLICATION_ADAPTERS_MONGODB_DATABASE_PORT,
      APPLICATION_ADAPTERS_MONGODB_DATABASE_USER,
      APPLICATION_ADAPTERS_MONGODB_DATABASE_PASSWORD
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
