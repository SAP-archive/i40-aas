import { Submodel, Property } from "i40-aas-objects";
import { KindEnum } from "i40-aas-objects/dist/src/types/KindEnum";
import { IdTypeEnum } from "i40-aas-objects/dist/src/types/IdTypeEnum";
import { KeyElementsEnum } from "i40-aas-objects/dist/src/types/KeyElementsEnum";
import { ValueTypeEnum } from "i40-aas-objects/dist/src/types/ValueTypeEnum";
import { SubmodelRepositoryService } from "../src/services/mongodb-client/operations/SubmodelRepositoryService";
import { SimpleMongoDbClient } from "../src/services/mongodb-client/operations/SimpleMongoDbClient";
import { ISubmodelRecord } from "../src/services/mongodb-client/model/ISubmodelRecord";
import { logger } from "../src/log";
import sinon from "sinon";
import { fail } from "assert";
import { expect } from "chai";
var chai = require("chai");
chai.should();
let md5 = require("md5");
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
function getProperty(idShort: string, value: string | undefined): Property {
  return new Property({
    embeddedDataSpecifications: [],
    kind: KindEnum.Instance,
    descriptions: [],
    idShort: idShort,
    parent: {
      keys: [
        {
          idType: IdTypeEnum.URI,
          type: KeyElementsEnum.Submodel,
          value:
            "sap.com/aas/submodels/part-100-device-information-model/10JF-1234-Jf14-PP22",
          local: true
        }
      ]
    },
    modelType: {
      name: KeyElementsEnum.Property
    },
    value: value,
    valueType: {
      dataObjectType: {
        name: ValueTypeEnum.string
      }
    }
  });
}
function getSubmodel(properties: Property[]): Submodel {
  let retVal: Submodel = new Submodel({
    embeddedDataSpecifications: [],
    semanticId: {
      keys: [
        {
          idType: IdTypeEnum.URI,
          type: KeyElementsEnum.GlobalReference,
          value:
            "opcfoundation.org/specifications-unified-architecture/part-100-device-information-model/",
          local: false
        }
      ]
    },
    kind: KindEnum.Instance,
    descriptions: [],
    idShort: "opc-ua-devices",
    identification: {
      id:
        "sap.com/aas/submodels/part-100-device-information-model/10JF-1234-Jf14-PP22",
      idType: IdTypeEnum.URI
    },
    modelType: {
      name: KeyElementsEnum.Submodel
    },
    submodelElements: []
  });
  properties.forEach(x => retVal.addSubmodelElement(x));
  return retVal;
}

describe("createEquipmentAndSetInitialValues", function() {
  const uuidv1 = require("uuid/v1");
  let mongoDbClient: SimpleMongoDbClient;
  let collectionName: string = "tests" + uuidv1();
  let MONGODB_INITDB_DATABASE = checkEnvVar(
    "STORAGE_ADAPTER_MONGODB_MONGODB_INITDB_DATABASE"
  );
  let MONGODB_HOST = checkEnvVar("MONGODB_HOST");
  let MONGODB_PORT = checkEnvVar("MONGODB_PORT");
  let MONGODB_INITDB_ROOT_USERNAME = checkEnvVar(
    "STORAGE_ADAPTER_MONGODB_MONGODB_INITDB_ROOT_USER"
  );
  let MONGODB_INITDB_ROOT_PASSWORD = checkEnvVar(
    "STORAGE_ADAPTER_MONGODB_MONGODB_INITDB_ROOT_PASSWORD"
  );
  if (MONGODB_INITDB_ROOT_USERNAME && MONGODB_INITDB_ROOT_PASSWORD) {
    logger.info("Using authentication");
  }
  before(async () => {
    if (MONGODB_INITDB_ROOT_USERNAME && MONGODB_INITDB_ROOT_PASSWORD) {
      logger.info("Using authentication");
    }
    mongoDbClient = new SimpleMongoDbClient(
      collectionName,
      MONGODB_INITDB_DATABASE,
      MONGODB_HOST,
      MONGODB_PORT,
      MONGODB_INITDB_ROOT_USERNAME,
      MONGODB_INITDB_ROOT_PASSWORD
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
  afterEach(async () => {
    sinon.restore();
  });
  it("will throw a 400 error if productinstanceuri is not defined in provided submodel", async function() {
    let submodel: Submodel = getSubmodel([
      getProperty("manufactureruri", "foobar.com"),
      getProperty("model", "Nx6")
    ]);
    let submodelRepositoryService: SubmodelRepositoryService = new SubmodelRepositoryService(
      mongoDbClient
    );
    try {
      await submodelRepositoryService.createEquipmentAndSetInitialValues(
        submodel
      );
    } catch (error) {
      error.should.have.nested.property("output.statusCode", 400);
      return;
    }
    fail("Error should have been thrown");
  });
  it("will throw a 400 error if productinstanceuri has no value in provided submodel", async function() {
    let submodel: Submodel = getSubmodel([
      getProperty("manufactureruri", "foobar.com"),
      getProperty("model", "Nx6"),
      getProperty("productinstanceuri", undefined)
    ]);
    let submodelRepositoryService: SubmodelRepositoryService = new SubmodelRepositoryService(
      mongoDbClient
    );
    try {
      await submodelRepositoryService.createEquipmentAndSetInitialValues(
        submodel
      );
    } catch (error) {
      error.should.have.nested.property("output.statusCode", 400);
      return;
    }
    fail("Error should have been thrown");
  });
  it("will update the corresponding submodel if it is asked to create a submodel with an id already in the database", async function() {
    const uuidv1 = require("uuid/v1");
    let uri = uuidv1();
    let submodel: Submodel = getSubmodel([
      getProperty("manufactureruri", "foobar.com"),
      getProperty("model", "Nx6"),
      getProperty("productinstanceuri", uri)
    ]);

    let submodelUpdated: Submodel = getSubmodel([
      getProperty("manufactureruri", "foobar.com"),
      getProperty("model", "Ny6"),
      getProperty("productinstanceuri", uri)
    ]);

    let submodelRepositoryService: SubmodelRepositoryService = new SubmodelRepositoryService(
      mongoDbClient
    );

    await submodelRepositoryService.createEquipmentAndSetInitialValues(
      submodel
    );
    await submodelRepositoryService.createEquipmentAndSetInitialValues(
      submodelUpdated
    );
    const submodelRecord: ISubmodelRecord | null = await mongoDbClient.getOneByKey(
      {
        _id: md5(uri)
      }
    );
    if (submodelRecord === null) {
      fail("Could not find submodel in database");
    } else {
      submodelRecord.should.have.property("version", 2);
    }
  });
});

describe("getSubmodels", function() {
  const uuidv1 = require("uuid/v1");
  let mongoDbClient: SimpleMongoDbClient;
  let collectionName: string = "tests" + uuidv1();
  let MONGODB_INITDB_DATABASE = checkEnvVar(
    "STORAGE_ADAPTER_MONGODB_MONGODB_INITDB_DATABASE"
  );
  let MONGODB_HOST = checkEnvVar("MONGODB_HOST");
  let MONGODB_PORT = checkEnvVar("MONGODB_PORT");
  let MONGODB_INITDB_ROOT_USERNAME = checkEnvVar(
    "STORAGE_ADAPTER_MONGODB_MONGODB_INITDB_ROOT_USER"
  );
  let MONGODB_INITDB_ROOT_PASSWORD = checkEnvVar(
    "STORAGE_ADAPTER_MONGODB_MONGODB_INITDB_ROOT_PASSWORD"
  );
  before(async () => {
    if (MONGODB_INITDB_ROOT_USERNAME && MONGODB_INITDB_ROOT_PASSWORD) {
      logger.info("Using authentication");
    }
    mongoDbClient = new SimpleMongoDbClient(
      collectionName,
      MONGODB_INITDB_DATABASE,
      MONGODB_HOST,
      MONGODB_INITDB_DATABASE,
      MONGODB_INITDB_ROOT_USERNAME,
      MONGODB_INITDB_ROOT_PASSWORD
    );
    await mongoDbClient.connect();
    try {
      await mongoDbClient.deleteCurrentCollection();
    } catch (e) {
      logger.debug(e);
    }
  });
  after(async () => {
    try {
      await mongoDbClient.deleteCurrentCollection();
      await mongoDbClient.disconnect();
    } catch (error) {
      logger.error("Error cleaning up:" + error);
    }
  });
  afterEach(function() {
    sinon.restore();
  });
  it("returns a list of previously created submodels", async function() {
    const uuidv1 = require("uuid/v1");
    let submodel: Submodel = getSubmodel([
      getProperty("manufactureruri", "foobar.com"),
      getProperty("model", "Nx6"),
      getProperty("productinstanceuri", uuidv1())
    ]);

    let submodelOther: Submodel = getSubmodel([
      getProperty("manufactureruri", "foobar.com"),
      getProperty("model", "Nx6"),
      getProperty("productinstanceuri", uuidv1())
    ]);

    let submodelRepositoryService: SubmodelRepositoryService = new SubmodelRepositoryService(
      mongoDbClient
    );

    await submodelRepositoryService.createEquipmentAndSetInitialValues(
      submodel
    );
    await submodelRepositoryService.createEquipmentAndSetInitialValues(
      submodelOther
    );

    let result = await submodelRepositoryService.getSubmodels();

    expect(result.length).to.equal(2);
  });
});
describe("delete", function() {
  const uuidv1 = require("uuid/v1");
  let mongoDbClient: SimpleMongoDbClient;
  let collectionName: string = "tests" + uuidv1();
  let MONGODB_INITDB_DATABASE = checkEnvVar(
    "STORAGE_ADAPTER_MONGODB_MONGODB_INITDB_DATABASE"
  );
  let MONGODB_HOST = checkEnvVar("MONGODB_HOST");
  let MONGODB_PORT = checkEnvVar("MONGODB_PORT");
  let MONGODB_INITDB_ROOT_USERNAME = checkEnvVar(
    "STORAGE_ADAPTER_MONGODB_MONGODB_INITDB_ROOT_USER"
  );
  let MONGODB_INITDB_ROOT_PASSWORD = checkEnvVar(
    "STORAGE_ADAPTER_MONGODB_MONGODB_INITDB_ROOT_PASSWORD"
  );

  before(async () => {
    if (MONGODB_INITDB_ROOT_USERNAME && MONGODB_INITDB_ROOT_PASSWORD) {
      logger.info("Using authentication");
    }
    mongoDbClient = new SimpleMongoDbClient(
      collectionName,
      MONGODB_INITDB_DATABASE,
      MONGODB_HOST,
      MONGODB_PORT,
      MONGODB_INITDB_ROOT_USERNAME,
      MONGODB_INITDB_ROOT_PASSWORD
    );
    await mongoDbClient.connect();
    try {
      await mongoDbClient.deleteCurrentCollection();
    } catch (e) {
      logger.debug(e);
    }
  });
  after(async () => {
    try {
      await mongoDbClient.deleteCurrentCollection();
      await mongoDbClient.disconnect();
    } catch (error) {
      logger.error("Error cleaning up:" + error);
    }
  });
  afterEach(function() {
    sinon.restore();
  });

  it("deletes by id", async function() {
    const uuidv1 = require("uuid/v1");
    let id1 = uuidv1();
    logger.debug("Generated id-md5:" + md5(id1));
    let submodel: Submodel = getSubmodel([
      getProperty("manufactureruri", "foobar.com"),
      getProperty("model", "Nx6"),
      getProperty("productinstanceuri", id1)
    ]);
    let id2 = uuidv1();
    logger.debug("Generated id-md5:" + md5(id2));
    let submodelOther: Submodel = getSubmodel([
      getProperty("manufactureruri", "foobar.com"),
      getProperty("model", "Nx6"),
      getProperty("productinstanceuri", id2)
    ]);

    let submodelRepositoryService: SubmodelRepositoryService = new SubmodelRepositoryService(
      mongoDbClient
    );
    let result = await submodelRepositoryService.getSubmodels();
    expect(result.length).to.equal(0);
    await submodelRepositoryService.createEquipmentAndSetInitialValues(
      submodel
    );
    await submodelRepositoryService.createEquipmentAndSetInitialValues(
      submodelOther
    );

    result = await submodelRepositoryService.getSubmodels();

    expect(result.length).to.equal(2);

    await submodelRepositoryService.delete(md5(id1));
    result = await submodelRepositoryService.getSubmodels();
    expect(result.length).to.equal(1);
    await submodelRepositoryService.delete(md5(id2));
    result = await submodelRepositoryService.getSubmodels();
    expect(result.length).to.equal(0);
  });
});
