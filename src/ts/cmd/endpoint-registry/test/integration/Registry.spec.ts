import { IAASDescriptor } from '../../src/services/registry/daos/interfaces/IAASDescriptor';
import { IEndpoint } from '../../src/services/registry/daos/interfaces/IEndpoint';
import {getConnection, AdvancedConsoleLogger } from 'typeorm';
import { EndpointEntity } from '../../src/services/registry/daos/entities/EndpointEntity'
import { IAsset, IIdentifier } from 'i40-aas-objects';
import {Identifier} from '../../src/services/registry/daos/responses/Identifier'
import { Identifiable } from 'i40-aas-objects/dist/src/characteristics/Identifiable';
import { TIdType } from 'i40-aas-objects/src/types/IdTypeEnum';
import { AssetEntity } from '../../src/services/registry/daos/entities/AssetEntity';
import { AASDescriptorEntity } from '../../src/services/registry/daos/entities/AASDescriptorEntity';
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../src/server').app;
var _ = require('lodash');

chai.should();
chai.use(chaiHttp);

function getRandomInteger() {
  return Math.floor(Math.random() * 100000);
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
        { address: 'efg.hij/' + idTag, type: 'type', target: 'edge', user: 'user', password: 'password' },
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
function replaceAsset(
  descriptor: IAASDescriptor,
  assetReplacementId: string,
) {
  descriptor.asset.id = assetReplacementId
  return descriptor;
}
function replaceAddressAndTypeInSecondEndpoint(
  descriptor: IAASDescriptor,
  addressReplacement: string,
  typeReplacement: string
) {
  descriptor.descriptor.endpoints[1].address = addressReplacement;
  descriptor.descriptor.endpoints[1].type = typeReplacement;
  return descriptor;
}
function removeOneEndpointAndReplaceOther(
  descriptor: IAASDescriptor,
  addressReplacement: string,
  typeReplacement: string
) {
  descriptor.descriptor.endpoints[0].address = addressReplacement;
  descriptor.descriptor.endpoints[0].type = typeReplacement;
  //remove all other endpoints
  descriptor.descriptor.endpoints.length>1?
  descriptor.descriptor.endpoints.length=1:descriptor.descriptor.endpoints.length

  return descriptor;
}
function replaceAddressTypeInFirstEndpointAndCertificateAndAsset(
  originalAASDescriptor: IAASDescriptor,
  addressReplacement: string,
  typeReplacement: string,
  certificateReplacement: string,
  assetReplacementId:string
) {
  originalAASDescriptor.descriptor.endpoints[0].address = addressReplacement;
  originalAASDescriptor.descriptor.endpoints[0].type = typeReplacement;
  originalAASDescriptor.descriptor.certificate_x509_i40 = certificateReplacement
  originalAASDescriptor.asset.id  = assetReplacementId;
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


  it('saves a descriptor in the the database', async function () {
    var uniqueTestId = 'simpleDataTest' + getRandomInteger();
    var requester = chai.request(app).keepOpen();

    await requester
      .put('/AASDescriptors')
      .auth(user, password)
      .send(makeGoodAASDescriptor(uniqueTestId))
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

  it('returns a 401 error if bad authentication details are provided', async function () {
    var uniqueTestId = 'simpleDataTest' + getRandomInteger();
    var requester = chai.request(app).keepOpen();

    await chai
      .request(app)
      .put('/AASDescriptors')
      .auth(user, 'blah')
      .send(makeGoodAASDescriptor(uniqueTestId))
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(401);
      });
  });

//GET /AASDescriptors Fetch a list of all AASDescriptors
//TODO: add a Test that returns an empty list
it('correctly retrieves a list of all AASDescriptors from the DB ', async function () {
  var uniqueTestId = 'simpleDataTest' + getRandomInteger();
  var uniqueTestId2 = 'simpleDataTest' + getRandomInteger();
  var requester = chai.request(app).keepOpen();
  var AASDescriptorRequest1 = makeGoodAASDescriptor(uniqueTestId);
  var AASDescriptorRequest2 = makeGoodAASDescriptor(uniqueTestId2);


  await requester
    .put('/AASDescriptors')
    .auth(user, password)
    .send(AASDescriptorRequest1)
    .then(async (res: any) => {
      chai.expect(res.status).to.eql(200);

      await requester
      .put('/AASDescriptors')
      .auth(user, password)
      .send(AASDescriptorRequest2)
        .then((res: any) => {
          chai.expect(res.status).to.eql(200);
       //   chai.expect((res.body as IAASDescriptor).identification.id).to.equal(uniqueTestId)
        });

    })
    .then(async () => {
      await requester
        .get('/AASDescriptors')
        .auth(user, password)
        .then((res: any) => {
          chai.expect(res.status).to.eql(200);
          chai.expect(res.body.length).not.to.eql(0)
          // chai.expect(
          //   _.some(res.body[0].descriptor.identification.id, {
          //     id: AASDescriptorRequest1.identification.id })).to.be.true;

       //   chai.expect((res.body as IAASDescriptor).identification.id).to.equal(uniqueTestId)
        });

    })
    .then(() => {
      requester.close();
    });
});


//  GET /AASDescriptors/aasid
  it('can handle slashes in the id', async function () {
    var uniqueTestId = 'simpleDataTest' + getRandomInteger();
    var requester = chai.request(app).keepOpen();
    var AASDescriptorIdWithSlash = replaceAasId(makeGoodAASDescriptor(uniqueTestId), uniqueTestId+'abc/def.dod');
    await requester
      .put('/AASDescriptors')
      .auth(user, password)
      .send(AASDescriptorIdWithSlash)
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(200);
        await requester
          .get('/AASDescriptors/' + encodeURIComponent(AASDescriptorIdWithSlash.identification.id))
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
    var AASDescriptorRequest = makeGoodAASDescriptor(uniqueTestId);


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
    var AASDescriptorRequest = makeGoodAASDescriptor(uniqueTestId);


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
    'can assign the same endpoint to multiple AASDescriptors',
    async function () {
      var uniqueTestId = 'simpleDataTest' + getRandomInteger();
      var requester = chai.request(app).keepOpen();
      var firstDescriptorRequest =   replaceAddressAndTypeInFirstEndpoint(
        makeGoodAASDescriptor(uniqueTestId),
        'http://abc.com-'+uniqueTestId,
        'http'
      )

      await requester
      //send the first Request
        .put('/AASDescriptors')
        .auth(user, password)
        .send(firstDescriptorRequest)
        //send a second request with different AASId and descriptor.Certificate but same Endpoint{address,type}
        .then(async (res: any) => {
          chai.expect(res.status).to.eql(200);
          var newUniqueTestId = 'simpleDataTest' + getRandomInteger();
          await requester
            .put('/AASDescriptors')
            .auth(user, password)
            .send(
              replaceAddressAndTypeInFirstEndpoint(
                makeGoodAASDescriptor(newUniqueTestId),
                'http://abc.com-'+uniqueTestId,
                'http'              )
            )
            //after succeeding to assign the endpoint also to the second AAS, check if the first AAS is still
            //related to it
            .then(async (res: any) => {
              chai.expect(res.status).to.eql(200);
              await requester
                .get('/AASDescriptors/aasId' + uniqueTestId)
                .auth(user, password)
                .then((res: any) => {
                  chai.expect(res.status).to.eql(200);
                  chai.expect(
                    _.some(res.body.descriptor.endpoints, {
                      address: firstDescriptorRequest.descriptor.endpoints[0].address })).to.be.true;
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
            makeGoodAASDescriptor(uniqueTestId),
            'http://abc.com-'+uniqueTestId,
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
                makeGoodAASDescriptor(newUniqueTestId),
                'http://abc.com-'+uniqueTestId,
                'grpc'              )
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



  it('is able to register the same descriptor again after deleting it '+
  ' (meaning that related entities were correctly deleted', async function () {
    var uniqueTestId = 'simpleDataTest' + getRandomInteger();
    var requester = chai.request(app).keepOpen();

    await requester
      .put('/AASDescriptors')
      .auth(user, password)
      .send(makeGoodAASDescriptor(uniqueTestId))
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
              .then(async(res: any) => {
                chai.expect(res.status).to.eql(404);
//try to register the deleted resource again
                await requester
                .put('/AASDescriptors')
                .auth(user, password)
                .send(makeGoodAASDescriptor(uniqueTestId))
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
      .send(makeGoodAASDescriptor(uniqueTestId))
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
      .send(makeGoodAASDescriptor(uniqueTestId))
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(200);

        await requester
          .delete('/AASDescriptors/aasId' + uniqueTestId +'-foo')
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
      .send(makeGoodAASDescriptor(uniqueTestId))
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(200);
        //patch the previous AASDescriptor
        await requester
          .patch('/AASDescriptors/aasId' + uniqueTestId)
          .auth(user, password)
          .send(replaceAddressTypeInFirstEndpointAndCertificateAndAsset(makeGoodAASDescriptor(uniqueTestId),
          'http://def.com-'+uniqueTestId,"newType","new-Certificate","new-Asset-ID"+ uniqueTestId))
          .then(async (res: any) => {
            chai.expect(res.status).to.eql(200);
            //read the AASDescriptor anc check if it was correctly updated
            await requester
              .get('/AASDescriptors/aasId' + uniqueTestId)
              .auth(user, password)
              .then((res: any) => {
                console.debug("Endpoint is "+res.body.descriptor.endpoints[1].address)
                chai.expect(res.status).to.eql(200);
                chai
                  .expect(res.body.asset.id)
                  .to.eql('new-Asset-ID' + uniqueTestId);
                  chai.expect(
                    _.some(res.body.descriptor.endpoints, {
                      address: 'http://def.com-'+uniqueTestId })).to.be.true;
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
        makeGoodAASDescriptor(uniqueTestId)
      )
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(200);
        await requester
        //the aasId as path parameter is different from the one in req body
        .patch('/AASDescriptors/aasId' + uniqueTestId )
        .auth(user, password)
          .send(
            replaceAddressAndTypeInFirstEndpoint(
              makeGoodAASDescriptor('foobar'+ uniqueTestId),
              'http://abc.com/'+uniqueTestId,
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
        makeGoodAASDescriptor(uniqueTestId)
      )
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(200);
        await requester
        .patch('/AASDescriptors/aasId' + 'foobar'+ uniqueTestId )
        .auth(user, password)
          .send(
            replaceAddressAndTypeInFirstEndpoint(
              makeGoodAASDescriptor('foobar'+ uniqueTestId),
              'http://abc.com/'+uniqueTestId,
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

  //TODO: consider deleting endpoints from the DB that are no longer related to an AASDescriptor
  //maybe with an DB Procedure
 /* it('should remove previously related Endpoints' +
     ' when updated with a AASDescriptor that has a lesser number of Endpoints',
  async function () {
    var uniqueTestId = 'simpleDataTest' + getRandomInteger();
    var requester = chai.request(app).keepOpen();

    await requester
    //send the first Request
      .put('/AASDescriptors')
      .auth(user, password)
      .send(
        replaceAddressAndTypeInSecondEndpoint(
          makeGoodAASDescriptor(uniqueTestId),
          'http://xyz.com-'+uniqueTestId,
          'http'
        )
      )
      // Update the AASDescriptor removing all but 1 Endpoints
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(200);
        var newUniqueTestId = 'simpleDataTest' + getRandomInteger();
        await requester
          .patch('/AASDescriptors/aasId'+uniqueTestId)
          .auth(user, password)
          .send(
            removeOneEndpointAndReplaceOther(
              makeGoodAASDescriptor(uniqueTestId),
              'http://abc.com-'+newUniqueTestId,
              'http'              )
          )

          //the second endpoint should have been deleted
          let endpointsRepository = getConnection().getRepository(EndpointEntity);
          // search for the original Endpoint (from the first PUT)
          let secondEndpointFound = endpointsRepository.find({
            address: 'http://xyz.com-'+uniqueTestId,
            type: 'http'
          })

          let firstEndpointsFound = endpointsRepository.find({
            address: 'http://abc.com-'+newUniqueTestId,
            type: 'http'
          })

          //this Endpoint should have been removed
          chai.expect((await secondEndpointFound).length).to.eql(0)
          chai.expect((await firstEndpointsFound).length).to.eql(1)

      })
      .then(() => {
        requester.close();
      });
  }
); */

  it('should remove previously related Assets when a AASDescriptor gets updated with a new Asset',
  async function () {
    var uniqueTestId = 'simpleDataTest' + getRandomInteger();
    var requester = chai.request(app).keepOpen();
    var request = makeGoodAASDescriptor(uniqueTestId)
    var originalAsset = request.asset;
    var newAsset = new Identifier("newAssetId", request.asset.idType as TIdType);
    let aasRepo = getConnection().getRepository(AASDescriptorEntity);

    await requester
    //send the first Request
      .put('/AASDescriptors')
      .auth(user, password)
      .send(
        request      )
      // Update the AASDescriptor with a new Asset
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(200);
        var aasFound = await aasRepo.findOne({
          id: request.identification.id
        },{ relations: ["asset"] })
//this Asset should have been removed
      chai.expect(aasFound?.asset.id).to.be.eql(originalAsset.id);
      await requester
          .patch('/AASDescriptors/aasId'+uniqueTestId)
          .auth(user, password)
          .send(replaceAsset(request,"newAssetId"+uniqueTestId))
            .then(async (res: any) => {
            chai.expect(res.status).to.eql(200);
          //the previous asset should have been replaced with the new one)
           aasFound = await aasRepo.findOne({
            id: request.identification.id
          },{ relations: ["asset"] })

          //relation to this Asset should have been removed (note: Asset entity still exists in DB)
          chai.expect(aasFound?.asset.id).to.be.eql("newAssetId"+uniqueTestId);
        })
      })
      .then(() => {
        requester.close();
      });
  });

  it('should not alter the Endpoints already associated other AASDescriptors when patching the Endpoints of an AASDescriptor',
  async function () {
    var uniqueTestId = 'simpleDataTest' + getRandomInteger();
    var secondUniqueTestId = 'simpleDataTest' + getRandomInteger();

    var requester = chai.request(app).keepOpen();

    await requester
    //register a first AAS with an Endpoint
      .put('/AASDescriptors')
      .auth(user, password)
      .send(
        replaceAddressAndTypeInFirstEndpoint(
          makeGoodAASDescriptor(uniqueTestId),
          'http://sampleEndpoint.com-'+uniqueTestId,
          'http'
        )
      )
      //register a Second AAS with the same Endpoint
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(200);
        await requester
        //register a first AAS with an Endpoint
          .put('/AASDescriptors')
          .auth(user, password)
          .send(
            replaceAddressAndTypeInFirstEndpoint(
              makeGoodAASDescriptor(secondUniqueTestId), //new AASId
              'http://sampleEndpoint.com-'+uniqueTestId, //old endpoint
              'http'
            )
          )
          //check how many AAS are assigned to this endpoint
               let endpointsRepository = getConnection().getRepository(EndpointEntity);
               let endpointFound = await endpointsRepository.findOne({
                 address: 'http://sampleEndpoint.com-'+uniqueTestId,
                 type: 'http'
               },{ relations: ["aasdescriptorIds"] })
               console.log("Found endpoint :"+JSON.stringify(endpointFound))

               chai.expect(endpointFound?.aasdescriptorIds.length).to.eql(2)
        })
      // Update the second AASDescriptor replacing the first Endpoint with another one
      .then(async (res: any) => {
        await requester
          .patch('/AASDescriptors/aasId'+secondUniqueTestId)
          .auth(user, password)
          .send(
            replaceAddressAndTypeInFirstEndpoint(
              makeGoodAASDescriptor(secondUniqueTestId),
              'http://sampleEndpoint.com-'+secondUniqueTestId, //new Endpoint
              'http'              )
          )
      .then( async (res: any)=> {
//check if patch succeeded
        chai.expect(res.status).to.eql(200);

        let endpointsRepository = getConnection().getRepository(EndpointEntity);
        let endpointFound = await endpointsRepository.findOne({
          address: 'http://sampleEndpoint.com-'+uniqueTestId,
          type: 'http'
        },{ relations: ["aasdescriptorIds"] })
        console.log("Found endpoint after :"+JSON.stringify(endpointFound))

        // this endpoint should have not be removed
        chai.expect(endpointFound?.aasdescriptorIds.length).to.eql(1)


      } ) })
      .then(() => {
        requester.close();
      });
  }
);

// test PUT /admin/
  it('can update endpoint addresses', async function () {
    var uniqueTestId = 'simpleDataTest' + getRandomInteger();
    var requester = chai.request(app).keepOpen();

    await requester
      .put('/admin/AASDescriptors')
      .auth(user, password)
      .send(
        makeGoodAASDescriptor(uniqueTestId)
      )
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(200);
        await requester
          .put('/admin/AASDescriptors')
          .auth(user, password)
          .send(
            replaceAddressAndTypeInFirstEndpoint(
              makeGoodAASDescriptor(uniqueTestId),
              'http://abc.com/'+uniqueTestId,
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
                    address: 'http://abc.com/'+uniqueTestId,
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
        makeGoodAASDescriptor(uniqueTestId)
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
            replaceEndpoints(makeGoodAASDescriptor(uniqueTestId), [
              makeGoodAASDescriptor(uniqueTestId).descriptor.endpoints[0],
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
