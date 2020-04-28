import { IAASDescriptor } from '../../src/services/registry/daos/interfaces/IAASDescriptor';
import { IEndpoint } from '../../src/services/registry/daos/interfaces/IEndpoint';
import { getConnection, AdvancedConsoleLogger } from 'typeorm';
import { ISemanticProtocol } from '../../src/services/registry/daos/interfaces/ISemanticProtocol'

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

function replaceAddressInFirstEndpoint(
  descriptor: IAASDescriptor,
  replacement: string
) {
  descriptor.descriptor.endpoints[0].address = replacement;
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


  it('saves a SemanticProtocol in the the database', async function () {
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
          .get('/SemanticProtocols/' + 'SemanticProtocolId' + uniqueTestId)
          .auth(user, password)
          .then((res: any) => {
            chai.expect(res.status).to.eql(200);
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

            //first register an AAS
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
          .put('/SemanticProtocols')
          .auth(user, password)
          .send(makeGoodSemanticProtocol(uniqueTestId2))
          .then(async (res: any) => {
            chai.expect(res.status).to.eql(200);
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
    });

/*
    //  GET /Semanticprotocols
    it('can handle slashes in the id', async function () {
      var uniqueTestId = 'simpleDataTest' + getRandomInteger();
      var requester = chai.request(app).keepOpen();
      var AASDescriptorIdWithSlash = replaceAasId(makeGoodSemanticProtocol(uniqueTestId), uniqueTestId + 'abc/def.dod');
      await requester
        .put('/Semanticprotocols')
        .auth(user, password)
        .send(AASDescriptorIdWithSlash)
        .then(async (res: any) => {
          chai.expect(res.status).to.eql(200);
          await requester
            .get('/Semanticprotocols/' + encodeURIComponent(AASDescriptorIdWithSlash.identification.id))
            .auth(user, password)
            .then((res: any) => {
              chai.expect(res.status).to.eql(200);
            });
        })
        .then(() => {
          requester.close();
        });
    });

    it('returns a 404 error if the AASDescriptor with the given aasId is not found in the database', async function () {
      var uniqueTestId = 'simpleDataTest' + getRandomInteger();
      var requester = chai.request(app).keepOpen();
      var AASDescriptorRequest = makeGoodSemanticProtocol(uniqueTestId);


      await requester
        .put('/AASDescriptors')
        .auth(user, password)
        .send(AASDescriptorRequest)
        .then(async (res: any) => {
          chai.expect(res.status).to.eql(200);

          await requester
            .get('/AASDescriptors/' + "foobar")
            .auth(user, password)
            .then((res: any) => {
              chai.expect(res.status).to.eql(404);
              //   chai.expect((res.body as IAASDescriptor).identification.id).to.equal(uniqueTestId)
            });

        })
        .then(() => {
          requester.close();
        });
    });
    it('correctly retrieves a AASDescriptor from the DB using aasId', async function () {
      var uniqueTestId = 'simpleDataTest' + getRandomInteger();
      var requester = chai.request(app).keepOpen();
      var AASDescriptorRequest = makeGoodSemanticProtocol(uniqueTestId);


      await requester
        .put('/AASDescriptors')
        .auth(user, password)
        .send(AASDescriptorRequest)
        .then(async (res: any) => {
          chai.expect(res.status).to.eql(200);

          await requester
            .get('/AASDescriptors/' + encodeURIComponent(AASDescriptorRequest.identification.id))
            .auth(user, password)
            .then((res: any) => {
              chai.expect(res.status).to.eql(200);
              //   chai.expect((res.body as IAASDescriptor).identification.id).to.equal(uniqueTestId)
            });

        })
        .then(() => {
          requester.close();
        });
    });


    // PUT AASDescriptor test
    it(
      'returns a 422 error if an endpoint with the given uri and type already' +
      'exists in the registry and removes all traces of the failed descriptor',
      async function () {
        var uniqueTestId = 'simpleDataTest' + getRandomInteger();
        var requester = chai.request(app).keepOpen();

        await requester
          //send the first Request
          .put('/AASDescriptors')
          .auth(user, password)
          .send(
            replaceAddressAndTypeInFirstEndpoint(
              makeGoodSemanticProtocol(uniqueTestId),
              'http://abc.com-' + uniqueTestId,
              'http'
            )
          )
          //send a second request with different AASId and descriptor.Certificate but same Endpoint{address,type}
          .then(async (res: any) => {
            chai.expect(res.status).to.eql(200);
            var newUniqueTestId = 'simpleDataTest' + getRandomInteger();
            await requester
              .put('/AASDescriptors')
              .auth(user, password)
              .send(
                replaceAddressAndTypeInFirstEndpoint(
                  makeGoodSemanticProtocol(newUniqueTestId),
                  'http://abc.com-' + uniqueTestId,
                  'http')
              )
              //after failing to register, check if traces from the previous, erroneous request was correctly not registered
              //i.e. the resource id should not be registed and thus return error
              .then(async (res: any) => {
                chai.expect(res.status).to.eql(422);
                await requester
                  .get('/AASDescriptors/aasId' + newUniqueTestId)
                  .auth(user, password)
                  .then((res: any) => {
                    chai.expect(res.status).to.eql(404);
                  });
              });
          })
          .then(() => {
            requester.close();
          });
      }
    );

    it(
      'registers an AASDescriptor if it contains Endpoints that have the same address ' +
      'but different type with an already registered Endpoint in DB',
      async function () {
        var uniqueTestId = 'simpleDataTest' + getRandomInteger();
        var requester = chai.request(app).keepOpen();

        await requester
          //send the first Request
          .put('/AASDescriptors')
          .auth(user, password)
          .send(
            replaceAddressAndTypeInFirstEndpoint(
              makeGoodSemanticProtocol(uniqueTestId),
              'http://abc.com-' + uniqueTestId,
              'http'
            )
          )
          //send a second request with different AASId and descriptor.Certificate but same Endpoint{address,type}
          .then(async (res: any) => {
            chai.expect(res.status).to.eql(200);
            var newUniqueTestId = 'simpleDataTest' + getRandomInteger();
            await requester
              .put('/AASDescriptors')
              .auth(user, password)
              .send(
                replaceAddressAndTypeInFirstEndpoint(
                  makeGoodSemanticProtocol(newUniqueTestId),
                  'http://abc.com-' + uniqueTestId,
                  'grpc')
              )
              //the composite primary key is {address, type} so this call should succeed
              .then(async (res: any) => {
                chai.expect(res.status).to.eql(200);
                await requester
                  .get('/AASDescriptors/aasId' + newUniqueTestId)
                  .auth(user, password)
                  .then((res: any) => {
                    chai.expect(res.status).to.eql(200);
                  });
              });
          })
          .then(() => {
            requester.close();
          });
      }
    );

    it('is able to register the same descriptor again after deleting it ' +
      ' (meaning that related entities were correctly deleted', async function () {
        var uniqueTestId = 'simpleDataTest' + getRandomInteger();
        var requester = chai.request(app).keepOpen();

        await requester
          .put('/AASDescriptors')
          .auth(user, password)
          .send(makeGoodSemanticProtocol(uniqueTestId))
          .then(async (res: any) => {
            chai.expect(res.status).to.eql(200);

            await requester
              .delete('/AASDescriptors/aasId' + uniqueTestId)
              .auth(user, password)
              .then(async (res: any) => {
                chai.expect(res.status).to.eql(200);
                await requester
                  .get('/AASDescriptors/aasId' + uniqueTestId)
                  .auth(user, password)
                  .then(async (res: any) => {
                    chai.expect(res.status).to.eql(404);
                    //try to register the deleted resource again
                    await requester
                      .put('/AASDescriptors')
                      .auth(user, password)
                      .send(makeGoodSemanticProtocol(uniqueTestId))
                      .then(async (res: any) => {
                        chai.expect(res.status).to.eql(200);
                      });
                  });
              });
          })
          .then(() => {
            requester.close();
          });
      });
    it('deletes an existing descriptor by id', async function () {
      var uniqueTestId = 'simpleDataTest' + getRandomInteger();
      var requester = chai.request(app).keepOpen();

      await requester
        .put('/AASDescriptors')
        .auth(user, password)
        .send(makeGoodSemanticProtocol(uniqueTestId))
        .then(async (res: any) => {
          chai.expect(res.status).to.eql(200);

          await requester
            .delete('/AASDescriptors/aasId' + uniqueTestId)
            .auth(user, password)
            .then(async (res: any) => {
              chai.expect(res.status).to.eql(200);
              await requester
                .get('/AASDescriptors/aasId' + uniqueTestId)
                .auth(user, password)
                .then((res: any) => {
                  chai.expect(res.status).to.eql(404);
                });
            });
        })
        .then(() => {
          requester.close();
        });
    });

    it('returns a 422 Error if the AASDescriptor to be deleted cannot be found in Database', async function () {
      var uniqueTestId = 'simpleDataTest' + getRandomInteger();
      var requester = chai.request(app).keepOpen();

      await requester
        .put('/AASDescriptors')
        .auth(user, password)
        .send(makeGoodSemanticProtocol(uniqueTestId))
        .then(async (res: any) => {
          chai.expect(res.status).to.eql(200);

          await requester
            .delete('/AASDescriptors/aasId' + uniqueTestId + '-foo')
            .auth(user, password)
            .then(async (res: any) => {
              chai.expect(res.status).to.eql(422);
            });
        })
        .then(() => {
          requester.close();
        });
    });
    // Test /patch route
    it('patches the descriptor if a descriptor with the given id already exists in the registry', async function () {
      var uniqueTestId = 'simpleDataTest' + getRandomInteger();
      var requester = chai.request(app).keepOpen();

      await requester
        .put('/AASDescriptors')
        .auth(user, password)
        .send(makeGoodSemanticProtocol(uniqueTestId))
        .then(async (res: any) => {
          chai.expect(res.status).to.eql(200);
          //patch the previous AASDescriptor
          await requester
            .patch('/AASDescriptors/aasId' + uniqueTestId)
            .auth(user, password)
            .send(replaceAddressTypeInFirstEndpointAndCertificateAndAsset(makeGoodSemanticProtocol(uniqueTestId),
              'http://def.com-' + uniqueTestId, "newType", "new-Certificate", "new-Asset-ID" + uniqueTestId))
            .then(async (res: any) => {
              chai.expect(res.status).to.eql(200);
              //read the AASDescriptor anc check if it was correctly updated
              await requester
                .get('/AASDescriptors/aasId' + uniqueTestId)
                .auth(user, password)
                .then((res: any) => {
                  console.debug("Endpoint is " + res.body.descriptor.endpoints[0].address)
                  chai.expect(res.status).to.eql(200);
                  chai
                    .expect(res.body.asset.id)
                    .to.eql('new-Asset-ID' + uniqueTestId);
                  chai
                    .expect(res.body.descriptor.endpoints[1].address)
                    .to.eql('http://def.com-' + uniqueTestId);
                  chai
                    .expect(res.body.descriptor.certificate_x509_i40)
                    .to.eql("new-Certificate");
                });
            });
        })
        .then(() => {
          requester.close();
        });
    });

    it('returns a 422 Error if the identification.id in the AASDescriptor is different from the aasId in the path parameter', async function () {
      var uniqueTestId = 'simpleDataTest' + getRandomInteger();
      var requester = chai.request(app).keepOpen();

      await requester
        .put('/AASDescriptors')
        .auth(user, password)
        .send(
          makeGoodSemanticProtocol(uniqueTestId)
        )
        .then(async (res: any) => {
          chai.expect(res.status).to.eql(200);
          await requester
            //the aasId as path parameter is different from the one in req body
            .patch('/AASDescriptors/aasId' + uniqueTestId)
            .auth(user, password)
            .send(
              replaceAddressAndTypeInFirstEndpoint(
                makeGoodSemanticProtocol('foobar' + uniqueTestId),
                'http://abc.com/' + uniqueTestId,
                'http'
              )
            )
            .then(async (res: any) => {
              chai.expect(res.status).to.eql(422);
            });
        })
        .then(() => {
          requester.close();
        });
    });
    it('returns a 422 Error if the AASDescriptor to be updated (with the aasId) is not found in DB', async function () {
      var uniqueTestId = 'simpleDataTest' + getRandomInteger();
      var requester = chai.request(app).keepOpen();

      await requester
        .put('/AASDescriptors')
        .auth(user, password)
        .send(
          makeGoodSemanticProtocol(uniqueTestId)
        )
        .then(async (res: any) => {
          chai.expect(res.status).to.eql(200);
          await requester
            .patch('/AASDescriptors/aasId' + 'foobar' + uniqueTestId)
            .auth(user, password)
            .send(
              replaceAddressAndTypeInFirstEndpoint(
                makeGoodSemanticProtocol('foobar' + uniqueTestId),
                'http://abc.com/' + uniqueTestId,
                'http'
              )
            )
            .then(async (res: any) => {
              chai.expect(res.status).to.eql(422);
            });
        })
        .then(() => {
          requester.close();
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


    it('can delete an endpoint address', async function () {
      var uniqueTestId = 'simpleDataTest' + getRandomInteger();
      var requester = chai.request(app).keepOpen();
      //register an AASDescriptor with 2 Endpoints
      await requester
        .put('/AASDescriptors')
        .auth(user, password)
        .send(
          makeGoodSemanticProtocol(uniqueTestId)
        )
        //patch the recource and remove one endpoint
        .then(async (res: any) => {
          chai.expect(res.status).to.eql(200);
          //originally there were 2 endpoints
          chai.expect(res.body.descriptor.endpoints.length).to.eql(2);

          await requester
            .patch('/AASDescriptors/aasId' + uniqueTestId)
            .auth(user, password)
            .send(
              replaceEndpoints(makeGoodSemanticProtocol(uniqueTestId), [
                makeGoodSemanticProtocol(uniqueTestId).descriptor.endpoints[0],
              ])
            )
            .then(async (res: any) => {
              chai.expect(res.status).to.eql(200);
              await requester
                .get('/AASDescriptors/aasId' + uniqueTestId)
                .auth(user, password)
                .then((res: any) => {
                  chai.expect(res.status).to.eql(200);
                  chai
                    .expect(res.body.descriptor.endpoints[0].address)
                    .to.eql('abc.def/' + uniqueTestId);

                  chai.expect(res.body.descriptor.endpoints.length).to.eql(1);
                });
            });
        })
        .then(() => {
          requester.close();
        });
    });


    //TEST PUT SemanticProtocol

    it("registers a semanticprotocol in the the database', async function () {
  var uniqueTestId = 'simpleDataTest' + getRandomInteger();
    var requester = chai.request(app).keepOpen();

    await requester
      .put('/semanticprotocol')
      .auth(user, password)
      .send(makeGoodSemanticProtocol(uniqueTestId))
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(200);
        await requester
          .get('/AASDescriptors/' + 'aasId' + uniqueTestId)
          .auth(user, password)
          .then((res: any) => {
            chai.expect(res.status).to.eql(200);
          });
      })
      .then(() => {
        requester.close();
      });
  });





  /*
    it('returns a 500 error if a connection to the db could not be established', async function() {
      this.timeout(10000) // all tests in this suite get 10 seconds before timeout
      var uniqueTestId = 'simpleDataTest' + getRandomInteger();
      var host = process.env.CORE_REGISTRIES_ENDPOINTS_DATABASE_HOST;
      process.env.CORE_REGISTRIES_ENDPOINTS_DATABASE_HOST = 'blah';
      await chai
        .request(app)
        .put('/AASDescriptors')
        .auth(user, password)
        .send(makeGoodAASDescriptor(uniqueTestId))
        .then(async (res: any) => {
          chai.expect(res.status).to.eql(500);
        })
        .finally(
          () => (process.env.CORE_REGISTRIES_ENDPOINTS_DATABASE_HOST = host)
        );
    });




    it('returns a 400 error if the uri is an empty string in the provided json object', async function () {
      var uniqueTestId = 'simpleDataTest' + getRandomInteger();
      var requester = chai.request(app).keepOpen();

      await chai
        .request(app)
        .put('/AASDescriptors')
        .auth(user, password)
        .send(
          replaceAddressInFirstEndpoint(makeGoodAASDescriptor(uniqueTestId), '')
        )
        .then(async (res: any) => {
          chai.expect(res.status).to.eql(400);
        });
    });

    it('returns a 400 error if a bad target is provided', async function () {
      var uniqueTestId = 'simpleDataTest' + Math.random();
      var requester = chai.request(app).keepOpen();

      await chai
        .request(app)
        .put('/AASDescriptors')
        .auth(user, password)
        .send(
          replaceTargetInFirstEndpoint(
            makeGoodAASDescriptor(uniqueTestId),
            'blah'
          )
        )
        .then(async (res: any) => {
          chai.expect(res.status).to.eql(400);
        });
    });

    it('returns a 400 error if the uri is missing in the provided json object', async function () {
      var uniqueTestId = 'simpleDataTest' + getRandomInteger();
      var requester = chai.request(app).keepOpen();

      await chai
        .request(app)
        .put('/AASDescriptors')
        .auth(user, password)
        .send(removeAddressInFirstEndpoint(makeGoodAASDescriptor(uniqueTestId)))
        .then(async (res: any) => {
          chai.expect(res.status).to.eql(400);
        });
    });

    it('returns a 400 error if a uri is badly formatted in the provided json object', async function () {
      var uniqueTestId = 'simpleDataTest' + getRandomInteger();

      await chai
        .request(app)
        .put('/AASDescriptors')
        .auth(user, password)
        .send(
          replaceAddressInFirstEndpoint(
            makeGoodAASDescriptor(uniqueTestId),
            '%%d//d'
          )
        )
        .then(async (res: any) => {
          chai.expect(res.status).to.eql(400);
        });
    });


    */
});
