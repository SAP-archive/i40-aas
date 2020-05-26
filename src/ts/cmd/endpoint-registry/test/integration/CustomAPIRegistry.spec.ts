import { IAASDescriptor } from '../../src/services/registry/daos/interfaces/IAASDescriptor';
import { IEndpoint } from '../../src/services/registry/daos/interfaces/IEndpoint';
import { getConnection, AdvancedConsoleLogger } from 'typeorm';
import { ISemanticProtocol } from '../../src/services/registry/daos/interfaces/ISemanticProtocol'
import { SemanticProtocolEntity } from '../../src/services/registry/daos/entities/SemanticProtocolEntity';
import { RoleEntity } from '../../src/services/registry/daos/entities/RoleEntity';
import { IIdentifier } from 'i40-aas-objects';
import { TIdType } from 'i40-aas-objects/dist/src/types/IdTypeEnum';
import { IRole } from '../../src/services/registry/daos/interfaces/IRole';
import { Identifier } from '../../src/services/registry/daos/responses/Identifier';
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../src/server').app;
var _ = require('lodash');

chai.should();
chai.use(chaiHttp);

function getRandomInteger() {
  return Math.floor(Math.random() * 100000);
}
function replaceRoleNameInFirstRole(
  protocol: ISemanticProtocol,
  replacement: string
) {
  protocol.roles[0].name = replacement;
  return protocol;
}
function makeGoodSemanticProtocolWithOneRole(idTag: string) {
  return <ISemanticProtocol>{
    identification: {
      id: 'semanticProtocolId' + idTag,
      idType: 'IRI',
    },
    roles: [
      {
        name: "roleA_" + idTag,
        aasDescriptorIds: [
          {
            id: "aasId" + idTag,
            idType: "Custom"
          }
        ]
      }
    ]
  };
}
function makeSemanticProtocolWithDifferentAAS(idTag: string) {
  return <ISemanticProtocol>{
    identification: {
      id: 'semanticProtocolId' + idTag,
      idType: 'IRI',
    },
    roles: [
      {
        name: "roleA_" + idTag,
        aasDescriptorIds: [
        ]
      }
    ]
  };
}
function makeGoodSemanticProtocolWith2Roles(semProtId: string, idTag1: string, idTag2: string) {
  return <ISemanticProtocol>{
    identification: {
      id: 'semanticProtocolId' + semProtId,
      idType: 'IRI',
    },
    roles: [
      {
        name: "roleA_" + idTag1,
        aasDescriptorIds: [
          {
            id: "aasId" + idTag1,
            idType: "Custom"
          }
        ]
      },
      {
        name: "roleB_" + idTag2,
        aasDescriptorIds: [
          {
            id: "aasId" + idTag2,
            idType: "Custom"
          }
        ]
      }

    ]
  };
}
function addAASIDtoFirstRoleofSemanticProtocol(originalSemProtocol: ISemanticProtocol, extraAAS: IIdentifier) {
  originalSemProtocol.roles[0].aasDescriptorIds.push(extraAAS)
  return originalSemProtocol;
}

function makeGoodAASDescriptor(idTag: string) {
  return <IAASDescriptor>{
    identification: {
      id: 'aasId' + idTag,
      idType: 'IRI',
    },
    asset: {
      id: 'assetId' + idTag,
      idType: 'IRI',
    },
    descriptor: {
      endpoints: [
        { address: 'abc.def/' + idTag, type: 'type', target: 'cloud' },
        { address: 'efg.hij/' + idTag, type: 'type', target: 'edge' },
      ],
      certificate_x509_i40: 'certificate',
      signature: 'signature',
    },
  };
}

function makeAASIdentifierRequestWithExtraAASId(
  role: IRole,
  extraAAS: IIdentifier
) {
  //add an extra AAS Identifier to the array
  role.aasDescriptorIds.push(extraAAS)
  return role.aasDescriptorIds

}


function checkEnvVar(variableName: string) {
  let retVal = process.env[variableName];
  if (retVal) {
    return retVal;
  } else {
    throw new Error(
      'A variable that is required by the skill has not been defined in the environment:' +
      variableName
    );
  }
}

describe('Tests with a simple data model', function () {
  var user = process.env.CORE_REGISTRIES_ENDPOINTS_USER;
  var password = process.env.CORE_REGISTRIES_ENDPOINTS_PASSWORD;
  before(async () => {
    checkEnvVar('CORE_REGISTRIES_ENDPOINTS_USER');
    checkEnvVar('CORE_REGISTRIES_ENDPOINTS_PASSWORD');
  });


  // TEST PUT /semanticProtocols
  it('returns a 422 Error when trying to register a SemanticProtocol that already exists in the the database',
    async function () {
      var uniqueTestId = 'simpleDataTest' + getRandomInteger();
      var requester = chai.request(app).keepOpen();

      //first register an AAS
      await requester
        .put('/AASDescriptors')
        .auth(user, password)
        .send(makeGoodAASDescriptor(uniqueTestId))
        .then(async (res: any) => {
          chai.expect(res.status).to.eql(200);

          //then register a semanticprotocol
          await requester
            .put('/SemanticProtocols')
            .auth(user, password)
            .send(makeGoodSemanticProtocolWithOneRole(uniqueTestId))
            .then(async (res: any) => {
              chai.expect(res.status).to.eql(200);

              //a second request with the same id should fail
              await requester
                .put('/SemanticProtocols')
                .auth(user, password)
                .send(makeGoodSemanticProtocolWithOneRole(uniqueTestId))
                .then(async (res: any) => {
                  chai.expect(res.status).to.eql(422);
                });
            })
            .then(() => {
              requester.close();
            });
        });
    });
  it('correctly saves a SemanticProtocol in the the database', async function () {
    var uniqueTestId = 'simpleDataTest' + getRandomInteger();
    var requester = chai.request(app).keepOpen();

    //first register an AAS
    await requester
      .put('/AASDescriptors')
      .auth(user, password)
      .send(makeGoodAASDescriptor(uniqueTestId))
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(200);


        await requester
          .put('/SemanticProtocols')
          .auth(user, password)
          .send(makeGoodSemanticProtocolWithOneRole(uniqueTestId))
          .then(async (res: any) => {
            chai.expect(res.status).to.eql(200);
            await requester
              .get('/SemanticProtocols/semanticProtocolId' + uniqueTestId)
              .auth(user, password)
              .then(async (res: any) => {
                chai.expect(res.status).to.eql(200);
                //check if role registered correctly

                let retrievedEntry = await getConnection().getRepository(SemanticProtocolEntity).findOne({ id: 'semanticProtocolId' + uniqueTestId })
                //console.log("found "+JSON.stringify(retrievedEntry));
                chai.expect(
                  _.some(retrievedEntry?.roles, {
                    name: "roleA_" + uniqueTestId
                  })).to.be.true;

              });
          })
          .then(() => {
            requester.close();
          });
      });
  });


  it('returns a 401 error if bad authentication details are provided', async function () {
    var uniqueTestId = 'simpleDataTest' + getRandomInteger();
    var requester = chai.request(app).keepOpen();

    await chai
      .request(app)
      .put('/SemanticProtocols')
      .auth(user, 'blah')
      .send(makeGoodSemanticProtocolWithOneRole(uniqueTestId))
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(401);
      });
  });


  //test GET /SemanticProtocols/:SemanticProtocolId'

  it('retrieves a SemanticProtocol from the the database using ' +
    'the SemanticProtocolId', async function () {
      var uniqueTestId = 'sampleGetSemProtId-' + getRandomInteger();
      var requester = chai.request(app).keepOpen();

      //first register an AAS
      await requester
        .put('/AASDescriptors')
        .auth(user, password)
        .send(makeGoodAASDescriptor(uniqueTestId))
        .then(async (res: any) => {
          chai.expect(res.status).to.eql(200);

          //then register a SemanticProtocol
          await requester
            .put('/SemanticProtocols')
            .auth(user, password)
            .send(makeGoodSemanticProtocolWithOneRole(uniqueTestId))
            .then(async (res: any) => {
              chai.expect(res.status).to.eql(200);
              //finally try retrieving the semantic protocol from the database
              await requester
                .get('/SemanticProtocols/semanticProtocolId' + uniqueTestId)
                .auth(user, password)
                .then((response: any) => {
                  chai.expect(response.status).to.eql(200);
                  console.log("body is " + JSON.stringify(response.body.roles))
                  //check if role registered correctly
                  chai.expect(
                    _.some(res.body.roles, {
                      name: "roleA_" + uniqueTestId
                    })).to.be.true;

                });
            })
            .then(() => {
              requester.close();
            });
        });
    });


  it('returns a 422 Error when trying to retrieve a SemanticProtocol ' +
    'with wrong SemanticProtocolId', async function () {
      var uniqueTestId = 'sampleGetSemProtId' + getRandomInteger();
      var requester = chai.request(app).keepOpen();

      //first register an AAS
      await requester
        .put('/AASDescriptors')
        .auth(user, password)
        .send(makeGoodAASDescriptor(uniqueTestId))
        .then(async (res: any) => {
          chai.expect(res.status).to.eql(200);

          //then register a SemanticProtocol
          await requester
            .put('/SemanticProtocols')
            .auth(user, password)
            .send(makeGoodSemanticProtocolWithOneRole(uniqueTestId))
            .then(async (res: any) => {
              chai.expect(res.status).to.eql(200);
              //finally try retrieving the semantic protocol from the database
              await requester
                .get('/SemanticProtocols/semanticProtocolId' + "-foobar")
                .auth(user, password)
                .then((res: any) => {
                  chai.expect(res.status).to.eql(422);
                });
            })
            .then(() => {
              requester.close();
            });
        });
    });


  // TEST DELETE SemanticProtocol

  it('deletes a SemanticProtocol descriptor by id', async function () {
    var uniqueTestId = 'sampleGetSemProtId-' + getRandomInteger();
    var requester = chai.request(app).keepOpen();

    //first register an AAS
    await requester
      .put('/AASDescriptors')
      .auth(user, password)
      .send(makeGoodAASDescriptor(uniqueTestId))
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(200);

        //then register a SemanticProtocol
        await requester
          .put('/SemanticProtocols')
          .auth(user, password)
          .send(makeGoodSemanticProtocolWithOneRole(uniqueTestId))
          .then(async (res: any) => {
            chai.expect(res.status).to.eql(200);
            let numProtFound = await getConnection().manager.find(SemanticProtocolEntity, { id: 'semanticProtocolId' + uniqueTestId })
            //console.log("Protocols found "+ JSON.stringify(numProtFound));
            chai.expect(numProtFound.length).to.be.eql(1);

            //finally try deleting the semantic protocol from the database
            await requester
              .delete('/SemanticProtocols/semanticProtocolId' + uniqueTestId)
              .auth(user, password)
              .then(async (response: any) => {
                chai.expect(response.status).to.eql(200);
                //check if entries deleted correctly
                let numProtFound = await getConnection().manager.find(SemanticProtocolEntity, { id: 'semanticProtocolId' + uniqueTestId })
                chai.expect(numProtFound.length).to.be.eql(0);
                //the related role should haven been also deleted (on cascade)
                let roleForProtFound = await getConnection().manager
                  .createQueryBuilder()
                  .select()
                  .from(RoleEntity, "role")
                  .where("role.semProtocol = :semProtocol", { semProtocol: 'semanticProtocolId' + uniqueTestId })
                  .execute();
                chai.expect(roleForProtFound.length).to.be.eql(0);

              });
          })
          .then(() => {
            requester.close();
          });
      });
  });



  it('is able to register the same semanticProtocol again after deleting it ' +
    ' (meaning that related entities were correctly deleted', async function () {
      var uniqueTestId = 'sampleGetSemProtId-' + getRandomInteger();
      var requester = chai.request(app).keepOpen();

      //first register an AAS
      await requester
        .put('/AASDescriptors')
        .auth(user, password)
        .send(makeGoodAASDescriptor(uniqueTestId))
        .then(async (res: any) => {
          chai.expect(res.status).to.eql(200);

          //then register a SemanticProtocol
          await requester
            .put('/SemanticProtocols')
            .auth(user, password)
            .send(makeGoodSemanticProtocolWithOneRole(uniqueTestId))
            .then(async (res: any) => {
              chai.expect(res.status).to.eql(200);
              let numProtFound = await getConnection().manager.find(SemanticProtocolEntity, { id: 'semanticProtocolId' + uniqueTestId })
              //console.log("Protocols found "+ JSON.stringify(numProtFound));
              chai.expect(numProtFound.length).to.be.eql(1);

              //finally try deleting the semantic protocol from the database
              await requester
                .delete('/SemanticProtocols/semanticProtocolId' + uniqueTestId)
                .auth(user, password)
                .then(async (response: any) => {
                  chai.expect(response.status).to.eql(200);
                  //check if entries deleted correctly
                  let numProtFound = await getConnection().manager.find(SemanticProtocolEntity, { id: 'semanticProtocolId' + uniqueTestId })
                  chai.expect(numProtFound.length).to.be.eql(0);
                  //the related role should haven been also deleted (on cascade)
                  let roleForProtFound = await getConnection().manager
                    .createQueryBuilder()
                    .select()
                    .from(RoleEntity, "role")
                    .where("role.semProtocol = :semProtocol", { semProtocol: 'semanticProtocolId' + uniqueTestId })
                    .execute();
                  chai.expect(roleForProtFound.length).to.be.eql(0);
                  //try registering again the same SemanticProtocol
                  await requester
                    .put('/SemanticProtocols')
                    .auth(user, password)
                    .send(makeGoodSemanticProtocolWithOneRole(uniqueTestId))
                    .then(async (res: any) => {
                      chai.expect(res.status).to.eql(200);
                    });
                });
            })
            .then(() => {
              requester.close();
            });
        });
    });


  it('returns a 422 Error if the SemanticProtocol to be deleted cannot be found in Database', async function () {
    var uniqueTestId = 'simpleDataTest' + getRandomInteger();
    var requester = chai.request(app).keepOpen();


    await requester
      .delete('/SemanticProtocols/semanticProtocolId' + 'foobarId')
      .auth(user, password)
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(422);
      })
      .then(() => {
        requester.close();
      });
  });


  // Test /PATCH /semanticprotocols route

  it('patches the semanticprotocol if a entry with the given id already exists in the registry', async function () {
    var uniqueTestId = 'simpleDataTest' + getRandomInteger();
    var requester = chai.request(app).keepOpen();

    await requester
      .put('/AASDescriptors')
      .auth(user, password)
      .send(makeGoodAASDescriptor(uniqueTestId))
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(200);

        //then register a SemanticProtocol
        await requester
          .put('/SemanticProtocols')
          .auth(user, password)
          .send(makeGoodSemanticProtocolWithOneRole(uniqueTestId))
          .then(async (res: any) => {
            chai.expect(res.status).to.eql(200);

            //try to update a semantic protocol with  a new role
            await requester
              .patch('/SemanticProtocols/semanticProtocolId' + uniqueTestId)
              .auth(user, password)
              .send(replaceRoleNameInFirstRole(makeGoodSemanticProtocolWithOneRole(uniqueTestId), 'newRoleA' + uniqueTestId))
              .then(async (res: any) => {
                chai.expect(res.status).to.eql(200);
                //load the roles for this semanticprotocol
                let rolesForProtFound: RoleEntity[] = await getConnection().manager
                  .createQueryBuilder()
                  .select()
                  .from(RoleEntity, "role")
                  .where("role.semProtocol = :semProtocol", { semProtocol: 'semanticProtocolId' + uniqueTestId })
                  .execute();
                //the number of roles should remain the same after the patch
                chai.expect(rolesForProtFound.length).to.eql(makeGoodSemanticProtocolWithOneRole(uniqueTestId).roles.length);
                console.log("rolesfound " + JSON.stringify(rolesForProtFound))
                chai.expect(
                  _.some(rolesForProtFound, {
                    name: "newRoleA" + uniqueTestId
                  })).to.be.true;

              })
          })
          .then(() => {
            requester.close();
          });
      });
  });

  it('returns a 422 Error if the identification.id in the SemanticPrototolc is different ' +
    'from the SemanticPrototolc in the path parameter', async function () {
      var uniqueTestId = 'simpleDataTest' + getRandomInteger();
      var differentUniqueTestId = 'simpleDataTest' + getRandomInteger();
      var requester = chai.request(app).keepOpen();

      await requester
        //the aasId as path parameter is different from the one in req body
        .patch('/SemanticProtocols/semanticProtocolId' + uniqueTestId)
        .auth(user, password)
        .send(
          makeGoodSemanticProtocolWithOneRole(differentUniqueTestId)
        )
        .then(async (res: any) => {
          chai.expect(res.status).to.eql(422);
        })
        .then(() => {
          requester.close();

        });
    });


  it('returns a 422 Error if the SemanticProtocol to be updated (with the aasId) is not found in DB', async function () {
    var uniqueTestId = 'simpleDataTest' + getRandomInteger();
    var requester = chai.request(app).keepOpen();

    await requester
      //the semanticprotocol with this id was not registered beforehand in the db
      .patch('/SemanticProtocols/semanticProtocolId' + uniqueTestId)
      .auth(user, password)
      .send(
        makeGoodSemanticProtocolWithOneRole(uniqueTestId)
      )
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(422);
      })
      .then(() => {
        requester.close();

      });
  });
  /*
  // Test GET all /semanticprotocols, Note: this can take over 2000ms and cause timeout
  //in case too many entries are found in DB
  it('retrieves a list of all SemanticProtocols', async function () {
    var uniqueTestId = 'simpleDataTest' + getRandomInteger();
    var uniqueTestId2 = 'simpleDataTest' + getRandomInteger();
    var requester = chai.request(app).keepOpen();

    //first register an AAS
    await requester
      .put('/AASDescriptors')
      .auth(user, password)
      .send(makeGoodAASDescriptor(uniqueTestId))
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(200);

        //register a second AAS
        await requester
          .put('/AASDescriptors')
          .auth(user, password)
          .send(makeGoodAASDescriptor(uniqueTestId2))
          .then(async (res: any) => {
            chai.expect(res.status).to.eql(200);


            //register first procotol
            await requester
              .put('/SemanticProtocols')
              .auth(user, password)
              .send(makeGoodSemanticProtocol(uniqueTestId))
              .then(async (res: any) => {
                chai.expect(res.status).to.eql(200);
                //register first procotol

                await requester
                  .get('/SemanticProtocols/')
                  .auth(user, password)
                  .then((res: any) => {
                    chai.expect(res.status).to.eql(200);
                    //chai.expect(res.bod)
                  });
              })
              .then(() => {
                requester.close();
              });
          });
      });
  });



//TODO: to be done
  it('can delete a role through patching  the semanticprotocol', async function () {
    var uniqueTestId = 'simpleDataTest' + getRandomInteger();
    var requester = chai.request(app).keepOpen();

    await requester
      .put('/AASDescriptors')
      .auth(user, password)
      .send(makeGoodAASDescriptor(uniqueTestId))
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(200);

        //then register a SemanticProtocol
        await requester
          .put('/SemanticProtocols')
          .auth(user, password)
          .send(makeGoodSemanticProtocol(uniqueTestId))
          .then(async (res: any) => {
            chai.expect(res.status).to.eql(200);

            //try to update a semantic protocol with  a new role
            await requester
              .patch('/SemanticProtocols/semanticProtocolId' + uniqueTestId)
              .auth(user, password)
              .send(replaceRoleNameInFirstRole(makeGoodSemanticProtocol(uniqueTestId), 'newRoleA' + uniqueTestId))
              .then(async (res: any) => {
                chai.expect(res.status).to.eql(200);
                //load the roles for this semanticprotocol
                let rolesForProtFound: RoleEntity[] = await getConnection().manager
                  .createQueryBuilder()
                  .select()
                  .from(RoleEntity, "role")
                  .where("role.semProtocol = :semProtocol", { semProtocol: 'semanticProtocolId' + uniqueTestId })
                  .execute();
                //the number of roles should remain the same after the patch
                chai.expect(rolesForProtFound.length).to.eql(makeGoodSemanticProtocol(uniqueTestId).roles.length);
                console.log("rolesfound " + JSON.stringify(rolesForProtFound))
                chai.expect(
                  _.some(rolesForProtFound, {
                    name: "newRoleA" + uniqueTestId
                  })).to.be.true;

              })
          })
          .then(() => {
            requester.close();
          });
      });
  });

  */
  // test PUT /admin/semanticProtocols
  it('can create or update semanticprotocols', async function () {
    var uniqueTestId = 'simpleDataTest' + getRandomInteger();
    var requester = chai.request(app).keepOpen();

    //first register an AAS
    await requester
      .put('/AASDescriptors')
      .auth(user, password)
      .send(makeGoodAASDescriptor(uniqueTestId))
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(200);

        //then register a SemanticProtocol
        await requester
          .put('/SemanticProtocols')
          .auth(user, password)
          .send(makeGoodSemanticProtocolWithOneRole(uniqueTestId))
          .then(async (res: any) => {
            chai.expect(res.status).to.eql(200);
            let numProtFound = await getConnection().manager.find(SemanticProtocolEntity, { id: 'semanticProtocolId' + uniqueTestId })
            //console.log("Protocols found "+ JSON.stringify(numProtFound));
            chai.expect(numProtFound.length).to.be.eql(1);

            //then try registering the same SemanticProtocol, it should update it
            await requester
              .put('/admin/SemanticProtocols')
              .auth(user, password)
              .send(makeGoodSemanticProtocolWithOneRole(uniqueTestId))
              .then(async (res: any) => {
                chai.expect(res.status).to.eql(200);
                let numProtFound = await getConnection().manager.find(SemanticProtocolEntity, { id: 'semanticProtocolId' + uniqueTestId })
                //console.log("Protocols found "+ JSON.stringify(numProtFound));
                chai.expect(numProtFound.length).to.be.eql(1);
              });
          });
      });
  });




  //test GET   /semanticProtocols/{sematicProtocolId}/role/{roleName}/AASDescriptors:

  it('retrieves all AASDescriptors by semanticProtocol and role', async function () {
    var firstTestId = 'randId-' + getRandomInteger();
    var secondTestId = 'randId' + getRandomInteger();
    var semProtocolTestId = 'randId' + getRandomInteger();
    var requester = chai.request(app).keepOpen();

    //first register an AAS
    var aasRequest_1 = makeGoodAASDescriptor(firstTestId)
    var aasRequest_2 = makeGoodAASDescriptor(secondTestId)

    await requester
      .put('/AASDescriptors')
      .auth(user, password)
      .send(aasRequest_1)
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(200);
        //register second AAS
        await requester
          .put('/AASDescriptors')
          .auth(user, password)
          .send(aasRequest_2)
          .then(async (res: any) => {

            //the SemanticProtocol to be registered
            var semProtocolRequest = makeGoodSemanticProtocolWith2Roles(semProtocolTestId, firstTestId, secondTestId)
            //then register a SemanticProtocol
            await requester
              .put('/SemanticProtocols')
              .auth(user, password)
              .send(semProtocolRequest)
              .then(async (res: any) => {
                chai.expect(res.status).to.eql(200);
                //finally try retrieving the list of AASs based on the semanticprotocol and rolename
                //read the AASDescriptor for the first role
                await requester
                  .get('/SemanticProtocols/semanticProtocolId' + semProtocolTestId + '/role/' + semProtocolRequest.roles[0].name + '/AASDescriptors')
                  .auth(user, password)
                  .then((response: any) => {
                    chai.expect(response.status).to.eql(200);
                    console.log("first read response is " + JSON.stringify(response.body) + " first AASID was " + JSON.stringify(aasRequest_1.identification))
                    //check if role registered correctly

                    chai.expect(
                      _.some(response.body, {
                        identification: aasRequest_1.identification
                      })).to.be.true;
                  });
              })
              .then(async (res: any) => {
                //read the AASDescriptor for the second role
                await requester
                  .get('/SemanticProtocols/semanticProtocolId' + semProtocolTestId + '/role/' + semProtocolRequest.roles[1].name + '/AASDescriptors')
                  .auth(user, password)
                  .then((response: any) => {
                    chai.expect(response.status).to.eql(200);
                    console.log("second read response is " + JSON.stringify(response.body) + " second AASID was " + JSON.stringify(aasRequest_2.identification))
                    //check if role registered correctly
                    chai.expect(
                      _.some(response.body, {
                        identification: aasRequest_2.identification
                      })).to.be.true;
                  });
              })
              .then(() => {
                requester.close();
              });
          });
      });
  });



  it("should throw a 422 if role does not exist when trying to retrieve" +
    " all AASDescriptors by semanticProtocol and role", async function () {
      var randTestId = 'randId-' + getRandomInteger();
      var requester = chai.request(app).keepOpen();

      //first register an AAS
      var aasRequest_1 = makeGoodAASDescriptor(randTestId)

      await requester
        .put('/AASDescriptors')
        .auth(user, password)
        .send(aasRequest_1)
        .then(async (res: any) => {
          chai.expect(res.status).to.eql(200);

          //the SemanticProtocol to be registered
          var semProtocolRequest = makeGoodSemanticProtocolWithOneRole(randTestId)
          //then register a SemanticProtocol
          await requester
            .put('/SemanticProtocols')
            .auth(user, password)
            .send(semProtocolRequest)
            .then(async (res: any) => {
              chai.expect(res.status).to.eql(200);
              //finally try retrieving the list of AASs based on the semanticprotocol and rolename
              //read the AASDescriptor for the first role
              await requester
                .get('/SemanticProtocols/semanticProtocolId' + randTestId + '/role/' + "fooBarRole" + '/AASDescriptors')
                .auth(user, password)
                .then((response: any) => {
                  chai.expect(response.status).to.eql(422);
                });
            })
            .then(() => {
              requester.close();
            });
        });
    });
  it("should return an empty array if no AASDescriptor exists for the given role when trying to retrieve" +
    " all AASDescriptors by semanticProtocol and role", async function () {
      var randTestId = 'randId-' + getRandomInteger();
      var requester = chai.request(app).keepOpen();

      //first register an AAS
      var aasRequest_1 = makeGoodAASDescriptor(randTestId)

      await requester
        .put('/AASDescriptors')
        .auth(user, password)
        .send(aasRequest_1)
        .then(async (res: any) => {
          chai.expect(res.status).to.eql(200);

          //the SemanticProtocol to be registered
          var semProtocolRequest = makeSemanticProtocolWithDifferentAAS(randTestId)
          //then register a SemanticProtocol
          await requester
            .put('/SemanticProtocols')
            .auth(user, password)
            .send(semProtocolRequest)
            .then(async (res: any) => {
              chai.expect(res.status).to.eql(200);
              //finally try retrieving the list of AASs based on the semanticprotocol and rolename
              //read the AASDescriptor for the first role
              await requester
                .get('/SemanticProtocols/semanticProtocolId' + randTestId + '/role/' + semProtocolRequest.roles[0].name + '/AASDescriptors')
                .auth(user, password)
                .then((response: any) => {
                  chai.expect(response.status).to.eql(200);

                  chai.expect(
                    response.body).to.be.eql([]);
                });
            })
            .then(() => {
              requester.close();
            });
        });
    });



  //PATCH secmanticProtocol
  it('adds a AASDescriptor Identifier to a role', async function () {
    var uniqueTestId = 'randId-' + getRandomInteger();
    var newUniqueTestId = 'extra-' + getRandomInteger();
    var requester = chai.request(app).keepOpen();

    //first register an AAS
    var aasRequest = makeGoodAASDescriptor(uniqueTestId)
    var extraAASRequest = makeGoodAASDescriptor(newUniqueTestId)

    await requester
      .put('/AASDescriptors')
      .auth(user, password)
      .send(aasRequest)
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(200);
        //register a second AAS (that will be assigned lated to the role with the patch)
        await requester
          .put('/AASDescriptors')
          .auth(user, password)
          .send(extraAASRequest)
          .then(async (res: any) => {
            chai.expect(res.status).to.eql(200);
            //the SemanticProtocol to be registered
            var semProtocolRequest = makeGoodSemanticProtocolWithOneRole(uniqueTestId)
            //then register a SemanticProtocol
            await requester
              .put('/SemanticProtocols')
              .auth(user, password)
              .send(semProtocolRequest)
              .then(async (res: any) => {
                chai.expect(res.status).to.eql(200);
                //finally try updating a specific role by adding an extra AAS Identifier the request should contain all the AAS ids
                await requester
                  .patch('/SemanticProtocols/semanticProtocolId' + uniqueTestId + '/role/' + semProtocolRequest.roles[0].name + '/AASDescriptors')
                  .auth(user, password)
                  .send(makeAASIdentifierRequestWithExtraAASId(semProtocolRequest.roles[0], extraAASRequest.identification))
                  .then(async (response: any) => {
                    chai.expect(response.status).to.eql(200);
                    //  console.log("body is " + JSON.stringify(response.body))
                    //check if AAS was assigned correctly to the role
                    let loadedRole = await getConnection().getRepository(RoleEntity).findOne({
                      where: [
                        { semProtocol: 'semanticProtocolId' + uniqueTestId }, { name: semProtocolRequest.roles[0].name }],
                      relations: ["aasDescriptorIds"]
                    })
                    console.log("AAS IDs " + JSON.stringify(loadedRole?.aasDescriptorIds))
                    //check if the new AAS was assigned to the role
                    chai.expect(
                      _.some(loadedRole?.aasDescriptorIds, {
                        id: extraAASRequest.identification.id
                      })).to.be.true;
                  });
              })
              .then(() => {
                requester.close();
              });
          });
      });
  });



  it('removes a AASDescriptor Identifier from a role', async function () {
    var uniqueTestId = 'randId-' + getRandomInteger();
    var newUniqueTestId = 'extra-' + getRandomInteger();
    var requester = chai.request(app).keepOpen();

    //first register an AAS
    var aasRequest = makeGoodAASDescriptor(uniqueTestId)
    var extraAASRequest = makeGoodAASDescriptor(newUniqueTestId)

    await requester
      .put('/AASDescriptors')
      .auth(user, password)
      .send(aasRequest)
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(200);
        //register a second AAS (that will be assigned lated to the role with the patch)
        await requester
          .put('/AASDescriptors')
          .auth(user, password)
          .send(extraAASRequest)
          .then(async (res: any) => {
            chai.expect(res.status).to.eql(200);
            //the SemanticProtocol to be registered
            var semProtocolRequest = addAASIDtoFirstRoleofSemanticProtocol(makeGoodSemanticProtocolWithOneRole(uniqueTestId), extraAASRequest.identification)
            //then register a SemanticProtocol
            await requester
              .put('/SemanticProtocols')
              .auth(user, password)
              .send(semProtocolRequest)
              .then(async (res: any) => {
                chai.expect(res.status).to.eql(200);
                //check if AAS was assigned correctly to the role
                let loadedRole = await getConnection().getRepository(RoleEntity).findOne({
                  where: [
                    { semProtocol: 'semanticProtocolId' + uniqueTestId }, { name: semProtocolRequest.roles[0].name }],
                  relations: ["aasDescriptorIds"]
                })
                chai.expect(
                  _.some(loadedRole?.aasDescriptorIds, {
                    id: extraAASRequest.identification.id
                  })).to.be.true;

                //finally try un-assigning am AASId from the role
                await requester
                  .delete('/SemanticProtocols/semanticProtocolId' + uniqueTestId + '/role/'
                    + semProtocolRequest.roles[0].name + '/AASDescriptors/' + extraAASRequest.identification.id)
                  .auth(user, password)
                  .then(async (response: any) => {
                    chai.expect(response.status).to.eql(200);
                    //  console.log("body is " + JSON.stringify(response.body))
                    //check if AAS Assignment was correctly removed from  the role
                    let loadedRole = await getConnection().getRepository(RoleEntity).findOne({
                      where: [
                        { semProtocol: 'semanticProtocolId' + uniqueTestId }, { name: semProtocolRequest.roles[0].name }],
                      relations: ["aasDescriptorIds"]
                    })
                    console.log("AAS IDs " + JSON.stringify(loadedRole?.aasDescriptorIds))
                    //check if the new AAS was assigned to the role
                    chai.expect(
                      _.some(loadedRole?.aasDescriptorIds, {
                        id: extraAASRequest.identification.id
                      })).to.be.false;
                  });
              })
              .then(() => {
                requester.close();
              });
          });
      });
  });
/*
  it('do not alter or remove a role already related to multiple AASDescriptors when updating a semantic protodol', async function () {
    var uniqueTestId = 'simpleDataTest' + getRandomInteger();
    var newUniqueTestId = 'newsimpleDataTest' + getRandomInteger();
    var requester = chai.request(app).keepOpen();

    //first register an AAS
    var aasRequest = makeGoodAASDescriptor(uniqueTestId)
    var secondAASRequest = makeGoodAASDescriptor(newUniqueTestId)
    var semProtocolRequestWithOneAAS = makeGoodSemanticProtocolWithOneRole(uniqueTestId)
    var secondSemProtocolRequestWithOneAAS = makeGoodSemanticProtocolWithOneRole(newUniqueTestId)

    // change the role of the second semProtocol to have the same AAS to the first one
    var secondSemProtocolRequest = addAASIDtoFirstRoleofSemanticProtocol(secondSemProtocolRequestWithOneAAS, aasRequest.identification)

    //register an AASDescriptor
    await requester
      .put('/AASDescriptors')
      .auth(user, password)
      .send(aasRequest)
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(200);
        //register a second AAS (that will be assigned lated to the role with the patch)
        await requester
          .put('/AASDescriptors')
          .auth(user, password)
          .send(secondAASRequest)
          //register a semantic protocol with a role
          .then(async (res: any) => {
            chai.expect(res.status).to.eql(200);
            //then register a SemanticProtocol with the first AAS associated to a role
            await requester
              .put('/SemanticProtocols')
              .auth(user, password)
              .send(semProtocolRequestWithOneAAS)
              .then(async (res: any) => {
                chai.expect(res.status).to.eql(200);
                //check if AAS was assigned correctly to the role
                let loadedRole = await getConnection().getRepository(RoleEntity).findOne({
                  where: [
                    { semProtocol: 'semanticProtocolId' + uniqueTestId }, { name: semProtocolRequestWithOneAAS.roles[0].name }],
                  relations: ["aasDescriptorIds"]
                })

                //The role should be assigned now to AASDescriptors
                console.log("Registered role AASs " + JSON.stringify(loadedRole?.aasDescriptorIds))
                chai.expect(
                  _.some(loadedRole?.aasDescriptorIds, {
                    id: semProtocolRequestWithOneAAS.roles[0].aasDescriptorIds[0].id
                  })).to.be.true;

                  //now register a second semantic protocol with a role that has the same AAS with the previous
                await requester
                  .put('/SemanticProtocols')
                  .auth(user, password)
                  .send(secondSemProtocolRequest)
                  chai.expect(res.status).to.eql(200);

                  let loadedRole2 = await getConnection().getRepository(RoleEntity).findOne({
                    where: [
                      { semProtocol: 'semanticProtocolId' + newUniqueTestId }, { name: secondSemProtocolRequest.roles[0].name }],
                    relations: ["aasDescriptorIds"]
                  })
                  //see if this role has indeed this AAS
                  chai.expect(
                    _.some(loadedRole2?.aasDescriptorIds, {
                      id: secondSemProtocolRequest.roles[0].aasDescriptorIds[0].id
                    })).to.be.true;

                //finally try un-assigning am AASId from the role
                 await requester
                   .delete('/SemanticProtocols/semanticProtocolId' + uniqueTestId + '/role/'
                     + semProtocolRequestWithOneAAS.roles[0].name + '/AASDescriptors/' + semProtocolRequestWithOneAAS.identification.id)
                   .auth(user, password)
                   .then(async (response: any) => {
                    chai.expect(response.status).to.eql(200);
                    //  console.log("body is " + JSON.stringify(response.body))
                    //check if AAS Assignment was correctly removed from  the role
                    let loadedRole = await getConnection().getRepository(RoleEntity).findOne({
                      where: [
                        { semProtocol: 'semanticProtocolId' + uniqueTestId }, { name: semProtocolRequestWithOneAAS.roles[0].name }],
                      relations: ["aasDescriptorIds"]
                    })
                    console.log("AAS IDs " + JSON.stringify(loadedRole?.aasDescriptorIds))
                    console.log("Original AAS IDs " + JSON.stringify(semProtocolRequestWithOneAAS))
                    //check if the new AAS was assigned to the role
                    chai.expect(
                      _.some(loadedRole?.aasDescriptorIds, {
                        id: secondSemProtocolRequest.identification.id
                      })).to.be.false;
                      //check that the original role AAS Assignment still exists
                    chai.expect(
                      _.some(loadedRole?.aasDescriptorIds, {
                        id: semProtocolRequestWithOneAAS.identification.id
                      })).to.be.true;

                  });
              })
              .then(async (res: any) => {
              })
              .then(() => {
                requester.close();
              });
          });
      });
  });
  */

});
