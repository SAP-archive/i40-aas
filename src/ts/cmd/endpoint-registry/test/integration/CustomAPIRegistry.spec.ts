import { IAASDescriptor } from '../../src/services/registry/daos/interfaces/IAASDescriptor';
import { IEndpoint } from '../../src/services/registry/daos/interfaces/IEndpoint';
import { getConnection, AdvancedConsoleLogger } from 'typeorm';
import { ISemanticProtocol } from '../../src/services/registry/daos/interfaces/ISemanticProtocol'
import { SemanticProtocolEntity } from '../../src/services/registry/daos/entities/SemanticProtocolEntity';
import { RoleEntity } from '../../src/services/registry/daos/entities/RoleEntity';

const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../src/server').app;
var _ = require('lodash');

chai.should();
chai.use(chaiHttp);

function getRandomInteger() {
  return Math.floor(Math.random() * 100000);
}

function makeGoodSemanticProtocol(idTag: string) {
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
      },
      {
        name: "roleB_" + idTag,
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

function replaceRoleNameInFirstRole(
  protocol: ISemanticProtocol,
  replacement: string
) {
  protocol.roles[0].name = replacement;
  return protocol;
}

function replaceEndpoints(
  descriptor: IAASDescriptor,
  endpoints: Array<IEndpoint>
) {
  descriptor.descriptor.endpoints = endpoints;
  return descriptor;
}


function replaceTargetInFirstEndpoint(
  descriptor: IAASDescriptor,
  replacement: string
) {
  descriptor.descriptor.endpoints[0].target = replacement;
  return descriptor;
}



function removeAddressInFirstEndpoint(descriptor: IAASDescriptor) {
  (<unknown>descriptor.descriptor.endpoints[0].address) = undefined;
  return descriptor;
}

function replaceAasId(descriptor: IAASDescriptor, replacement: string) {
  descriptor.identification.id = replacement;
  return descriptor;
}

function replaceAddressAndTypeInFirstEndpoint(
  descriptor: IAASDescriptor,
  addressReplacement: string,
  typeReplacement: string
) {
  descriptor.descriptor.endpoints[0].address = addressReplacement;
  descriptor.descriptor.endpoints[0].type = typeReplacement;
  return descriptor;
}
function replaceAddressTypeInFirstEndpointAndCertificateAndAsset(
  originalAASDescriptor: IAASDescriptor,
  addressReplacement: string,
  typeReplacement: string,
  certificateReplacement: string,
  assetReplacementId: string
) {
  originalAASDescriptor.descriptor.endpoints[0].address = addressReplacement;
  originalAASDescriptor.descriptor.endpoints[0].type = typeReplacement;
  originalAASDescriptor.descriptor.certificate_x509_i40 = certificateReplacement
  originalAASDescriptor.asset.id = assetReplacementId;
  return originalAASDescriptor;
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
            .send(makeGoodSemanticProtocol(uniqueTestId))
            .then(async (res: any) => {
              chai.expect(res.status).to.eql(200);

              //a second request with the same id should fail
              await requester
                .put('/SemanticProtocols')
                .auth(user, password)
                .send(makeGoodSemanticProtocol(uniqueTestId))
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
          .send(makeGoodSemanticProtocol(uniqueTestId))
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
      .send(makeGoodSemanticProtocol(uniqueTestId))
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
            .send(makeGoodSemanticProtocol(uniqueTestId))
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
            .send(makeGoodSemanticProtocol(uniqueTestId))
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
          .send(makeGoodSemanticProtocol(uniqueTestId))
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
            .send(makeGoodSemanticProtocol(uniqueTestId))
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
                    .send(makeGoodSemanticProtocol(uniqueTestId))
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
          makeGoodSemanticProtocol(differentUniqueTestId)
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
      makeGoodSemanticProtocol(uniqueTestId)
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


  // test PUT /admin/
  it('can update endpoint addresses', async function () {
    var uniqueTestId = 'simpleDataTest' + getRandomInteger();
    var requester = chai.request(app).keepOpen();

    await requester
      .put('/admin/AASDescriptors')
      .auth(user, password)
      .send(
        makeGoodSemanticProtocol(uniqueTestId)
      )
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(200);
        await requester
          .put('/admin/AASDescriptors')
          .auth(user, password)
          .send(
            replaceAddressAndTypeInFirstEndpoint(
              makeGoodSemanticProtocol(uniqueTestId),
              'http://abc.com/' + uniqueTestId,
              'http'
            )
          )
          .then(async (res: any) => {
            chai.expect(res.status).to.eql(200);
            await requester
              .get('/AASDescriptors/aasId' + uniqueTestId)
              .auth(user, password)
              .then((res: any) => {
                chai.expect(res.status).to.eql(200);
                chai.expect(
                  _.some(res.body.descriptor.endpoints, {
                    address: 'http://abc.com/' + uniqueTestId,
                  })
                ).to.be.true;

                chai.expect(res.body.descriptor.endpoints.length).to.eql(2);
              });
          });
      })
      .then(() => {
        requester.close();
      });
  });

        */


  //test GET   /semanticProtocols/{sematicProtocolId}/role/{roleName}/AASDescriptors:


  it('retrieves all AASDescriptors by semanticProtocol and role', async function () {
      var firstTestId = 'randId-' + getRandomInteger();
      var secondTestId = 'randId' + getRandomInteger();
      var requester = chai.request(app).keepOpen();

      //first register an AAS
      var aasRequest = makeGoodAASDescriptor(firstTestId)

      await requester
        .put('/AASDescriptors')
        .auth(user, password)
        .send(aasRequest)
        .then(async (res: any) => {
          chai.expect(res.status).to.eql(200);
          //register second AAS
          await requester
          .put('/AASDescriptors')
          .auth(user, password)
          .send(makeGoodAASDescriptor(secondTestId))
          .then(async (res: any) => {

            //the SemanticProtocol to be registered
          var semProtocolRequest = makeGoodSemanticProtocol(firstTestId)
          //then register a SemanticProtocol
          await requester
            .put('/SemanticProtocols')
            .auth(user, password)
            .send(semProtocolRequest)
            .then(async (res: any) => {
              chai.expect(res.status).to.eql(200);
              //finally try retrieving the list of AASs based on the semanticprotocol and rolename
              await requester
                .get('/SemanticProtocols/semanticProtocolId' + firstTestId+ '/role/'+semProtocolRequest.roles[0]+'/AASDescriptors')
                .auth(user, password)
                .then((response: any) => {
                  chai.expect(response.status).to.eql(200);
                //  console.log("body is " + JSON.stringify(response.body))
                  //check if role registered correctly
                  chai.expect(
                    _.some(response.body, {
                      identification: aasRequest.identification
                    })).to.be.true;

                });
            })
            .then(() => {
              requester.close();
            });
        });
    });
  });

});
