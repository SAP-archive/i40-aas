import { fail } from "assert";
import { logger } from "../../src/log";
import { SimpleMongoDbClient } from "../../src/persistence/SimpleMongoDbClient";
import { IStateRecord } from "../../src/services/onboarding/persistenceinterface/IStateRecord";
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
  let MONGO_INITDB_DATABASE = checkEnvVar("SKILLS_ONBOARDING_DATABASE_NAME");
  let MONGODB_HOST = checkEnvVar("SKILLS_ONBOARDING_DATABASE_HOST");
  let MONGODB_PORT = checkEnvVar("SKILLS_ONBOARDING_DATABASE_PORT");
  let MONGO_INITDB_ROOT_USERNAME = checkEnvVar("SKILLS_ONBOARDING_DATABASE_USER");
  let MONGO_INITDB_ROOT_PASSWORD = checkEnvVar("SKILLS_ONBOARDING_DATABASE_PASSWORD");

  before(async () => {
    if (!MONGODB_HOST || !MONGODB_PORT || !MONGO_INITDB_DATABASE) {
      throw new Error(
        "These environment variables need to be set: SKILLS_ONBOARDING_DATABASE_HOST, SKILLS_ONBOARDING_DATABASE_PORT, SKILLS_ONBOARDING_DATABASE_NAME"
      );
    }
    if (MONGO_INITDB_ROOT_USERNAME && MONGO_INITDB_ROOT_PASSWORD) {
      logger.info("Using authentication");
    }
    mongoDbClient = new SimpleMongoDbClient(
      collectionName,
      MONGO_INITDB_DATABASE,
      MONGODB_HOST,
      MONGO_INITDB_DATABASE,
      MONGO_INITDB_ROOT_USERNAME,
      MONGO_INITDB_ROOT_PASSWORD
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
    let stateRecord: any = {
      _id: "ASDS-KLKD-POPF-TDGF",
      serializedState: "WaitingForOnboardingRequest"
    };
    await mongoDbClient.update(
      { _id: stateRecord._id },
      { serializedState: stateRecord.serializedState },
      true
    );
    let result: IStateRecord | null = await mongoDbClient.getOneByKey({
      _id: stateRecord._id
    });
    if (!result) {
      fail("Error");
      return;
    }
    expect(result.serializedState).to.be.equal(stateRecord.serializedState);
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
    let result: IStateRecord | null = await mongoDbClient.getOneByKey({
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
