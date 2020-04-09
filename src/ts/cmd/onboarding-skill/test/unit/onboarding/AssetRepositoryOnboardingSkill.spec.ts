import { expect } from 'chai';
import { logger } from '../../../src/log';
import { Skill } from '../../../src/base/Skill';
import sinon from 'sinon';
import { MyAasMessageDispatcher } from '../../../src/services/onboarding/MyAasMessageDispatcher';
import { WebClient } from '../../../src/web/WebClient';
import fs from 'fs';
import { MessageSender } from '../../../src/base/messaging/MessageSender';
import { IMessageSender } from '../../../src/base/messaginginterface/IMessageSender';
import { SimpleMongoDbClient } from '../../../src/base/persistence/SimpleMongoDbClient';

import Axios, { AxiosError } from 'axios';
import { AmqpClient } from 'AMQP-Client/lib/AmqpClient';
import { InteractionMessage } from 'i40-aas-objects';
import { IConversationMember } from 'i40-aas-objects/dist/src/interaction/ConversationMember';
import { MyExternalRestServiceCaller } from '../../../src/services/onboarding/MyExternalRestServiceCaller';
import { MyInitializer } from '../../../src/services/onboarding/MyInitializer';

const initializeLogger = require('../../../src/log');

//TODO: if tests fail they do not signal done to Mocha
//assertions need to be put in a try catch block, signalling done("Error") in case of failure
function makeRequestError(statusCode: number): AxiosError<any> {
  let error: Error = new Error('AxiosError');
  let axiosProps: AxiosError = {
    config: {},
    name: '',
    message: '',
    isAxiosError: true,
    response: {
      data: {},
      status: statusCode,
      statusText: '',
      headers: {},
      config: {},
    },
    toJSON: () => {
      throw new Error('Not implemented in mock');
    },
  };
  Object.assign(error, axiosProps);
  return error as AxiosError;
}
function makeMockDbClient() {
  return new SimpleMongoDbClient('tests', '', '', '');
}

describe('applyEvent', function () {
  let message = <InteractionMessage>{
    frame: {
      type: 'type',
      messageId: 'messageId',
      receiver: {
        identification: {
          id: 'receiver-id',
          idType: 'Custom',
        },
        role: {
          name: 'central-asset-repository',
        },
      },
      semanticProtocol: 'semprot',
      sender: {
        identification: {
          id: 'sender-id',
          idType: 'Custom',
        },
        role: {
          name: 'sender',
        },
      },
      conversationId: 'conversationId',
    },
    interactionElements: [{}],
  };
  this.beforeEach(function () {});
  this.afterEach(function () {
    sinon.restore();
  });
  //TODO: refactor to not test so many things in one test
  it(
    'sends out correct messages when creating an instance and ends up in' +
      'InstancePublished via CreatingInstance, counting up versions correctly',
    function (done) {
      let conversationId = 'abcd1234';
      let messageDispatcher: MyAasMessageDispatcher = new MyAasMessageDispatcher(
        <IMessageSender>{}
      );
      let restClient: MyExternalRestServiceCaller = new MyExternalRestServiceCaller(
        <WebClient>{},
        'data-manager'
      );

      let dbClient = makeMockDbClient();

      let fakeStoreInDb = sinon.fake.resolves({ result: 'ok' });
      sinon.replace(dbClient, 'connect', sinon.fake.resolves({}));
      sinon.replace(dbClient, 'disconnect', sinon.fake.resolves({}));
      sinon.replace(dbClient, 'update', fakeStoreInDb);
      sinon.replace(dbClient, 'getOneByKey', sinon.fake.returns(null));

      let fakesendResponseInstanceToOperator = sinon.fake();
      sinon.replace(
        messageDispatcher,
        'sendResponseInstanceToOperator',
        fakesendResponseInstanceToOperator
      );

      let fakecreateInstanceOnCAR = sinon.fake.returns({ status: 200 });
      sinon.replace(restClient, 'createInstanceOnCAR', fakecreateInstanceOnCAR);

      let skill: Skill = new Skill(
        new MyInitializer(messageDispatcher, restClient, {}),
        dbClient
      );
      skill.applyEvent(
        'PUBLISHINSTANCE_FROM_OPERATOR',
        conversationId,
        message,
        (state) => {
          if (state.value === 'InstancePublished') {
            sinon.assert.calledWith(
              fakeStoreInDb,
              sinon.match.has('version', 0),
              sinon.match.has(
                'serializedState',
                sinon.match('CreatingInstance')
              ),
              sinon.match.any
            );
            sinon.assert.calledWith(
              fakeStoreInDb,
              sinon.match.has('version', 1),
              sinon.match.has(
                'serializedState',
                sinon.match('InstancePublished')
              ),
              sinon.match.any
            );
            sinon.assert.calledOnce(fakesendResponseInstanceToOperator);
            done();
          }
        }
      );
    }
  );
  it('moves into WaitForApproval when requestApproval is set, sending out the correct messages', function (done) {
    let conversationId = 'abcd1234';
    let messageSender: MessageSender = new MessageSender(
      <AmqpClient>{},
      <IConversationMember>{},
      ''
    );
    let messageDispatcher: MyAasMessageDispatcher = new MyAasMessageDispatcher(
      messageSender
    );

    let restClient: MyExternalRestServiceCaller = new MyExternalRestServiceCaller(
      <WebClient>{},
      'data-manager'
    );

    let dbClient = makeMockDbClient();

    let fakeStoreInDb = sinon.fake.resolves({ result: 'ok' });
    sinon.replace(dbClient, 'connect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'disconnect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'update', fakeStoreInDb);
    sinon.replace(dbClient, 'getOneByKey', sinon.fake.returns(null));

    let fakesendTo = sinon.fake();
    sinon.replace(messageSender, 'sendTo', fakesendTo);
    //sinon.replace(messageSender, "replyTo", sinon.fake());

    let skill: Skill = new Skill(
      new MyInitializer(messageDispatcher, restClient, {
        askForApproval: true,
      }),
      dbClient
    );

    skill.applyEvent(
      'PUBLISHINSTANCE_FROM_OPERATOR',
      conversationId,
      message,
      (state) => {
        if (state.value === 'WaitingForApproval') {
          sinon.assert.calledWith(
            fakesendTo,
            sinon.match.hasNested('receiver.role.name', 'approver') &&
              sinon.match.has('type', 'requestApproval') &&
              sinon.match.hasNested(
                'sender.role.name',
                'central-asset-repository'
              )
          );
          done();
        }
      }
    );
  });

  it('moves into CreatingInstance from WaitForApproval on receipt of APPROVED_FROM_APPROVER (when requestApproval is set), sending out the correct messages', function (done) {
    let messageFromApprover = <InteractionMessage>{
      frame: {
        type: 'approved',
        messageId: 'messageId',
        receiver: {
          identification: {
            id: 'receiver-id',
            idType: 'Custom',
          },
          role: {
            name: 'central-asset-repository',
          },
        },
        semanticProtocol: 'semprot',
        sender: {
          identification: {
            id: 'sender-id',
            idType: 'Custom',
          },
          role: {
            name: 'approver',
          },
        },
        conversationId: 'conversationId',
      },
      interactionElements: [{}],
    };

    let conversationId = 'abcd1234';
    let messageSender: MessageSender = new MessageSender(
      <AmqpClient>{},
      <IConversationMember>{},
      ''
    );
    let messageDispatcher: MyAasMessageDispatcher = new MyAasMessageDispatcher(
      messageSender
    );
    let dbClient = makeMockDbClient();
    let restClient: MyExternalRestServiceCaller = new MyExternalRestServiceCaller(
      <WebClient>{},
      'data-manager'
    );
    let fakeStoreInDb = sinon.fake.resolves({ result: 'ok' });

    sinon.replace(dbClient, 'connect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'disconnect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'update', fakeStoreInDb);
    sinon.replace(
      dbClient,
      'getOneByKey',
      sinon.fake.resolves({
        _id: conversationId,
        version: 2,
        serializedState: fs.readFileSync(
          process.cwd() +
            '/test/data/onboarding/sample-state-wait-for-approval.json',
          'utf8'
        ),
      })
    );

    let fakecreateInstanceOnCAR = sinon.fake.resolves({ status: 200 });
    sinon.replace(restClient, 'createInstanceOnCAR', fakecreateInstanceOnCAR);

    let fakeReplyTo = sinon.fake();
    sinon.replace(messageSender, 'replyTo', fakeReplyTo);

    let fakeSendTo = sinon.fake();
    sinon.replace(messageSender, 'sendTo', fakeSendTo);

    let skill: Skill = new Skill(
      new MyInitializer(messageDispatcher, restClient, {
        askForApproval: true,
      }),
      dbClient
    );

    skill.applyEvent(
      'APPROVED_FROM_APPROVER',
      conversationId,
      messageFromApprover,
      (state) => {
        if (state.value === 'InstancePublished') {
          sinon.assert.notCalled(fakeReplyTo);
          sinon.assert.calledOnce(fakecreateInstanceOnCAR);
          sinon.assert.calledWith(
            fakeSendTo,
            sinon.match
              .hasNested('type', 'responseInstance')
              .and(sinon.match.hasNested('receiver.role.name', 'Operator')),
            sinon.match.any
          );
          done();
        }
      }
    );
  });

  it('sends back a requestRefused on receipt of REQUESTREFUSED_FROM_APPROVER (when requestApproval is set)', function (done) {
    let messageFromApprover = <InteractionMessage>{
      frame: {
        type: 'approved',
        messageId: 'messageId',
        receiver: {
          identification: {
            id: 'receiver-id',
            idType: 'Custom',
          },
          role: {
            name: 'central-asset-repository',
          },
        },
        semanticProtocol: 'semprot',
        sender: {
          identification: {
            id: 'sender-id',
            idType: 'Custom',
          },
          role: {
            name: 'approver',
          },
        },
        conversationId: 'conversationId',
      },
      interactionElements: [{}],
    };

    let conversationId = 'abcd1234';
    let messageSender: MessageSender = new MessageSender(
      <AmqpClient>{},
      <IConversationMember>{},
      ''
    );
    let messageDispatcher: MyAasMessageDispatcher = new MyAasMessageDispatcher(
      messageSender
    );
    let restClient: MyExternalRestServiceCaller = new MyExternalRestServiceCaller(
      <WebClient>{},
      'data-manager'
    );
    let dbClient = makeMockDbClient();

    let fakeStoreInDb = sinon.fake.resolves({ result: 'ok' });

    sinon.replace(dbClient, 'connect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'disconnect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'update', fakeStoreInDb);
    sinon.replace(
      dbClient,
      'getOneByKey',
      sinon.fake.resolves({
        _id: conversationId,
        version: 2,
        serializedState: fs.readFileSync(
          process.cwd() +
            '/test/data/onboarding/sample-state-wait-for-approval.json',
          'utf8'
        ),
      })
    );

    let fakeSendTo = sinon.fake();
    sinon.replace(messageSender, 'sendTo', fakeSendTo);

    let skill: Skill = new Skill(
      new MyInitializer(messageDispatcher, restClient, {
        askForApproval: true,
      }),
      dbClient
    );

    skill.applyEvent(
      'REQUESTREFUSED_FROM_APPROVER',
      conversationId,
      messageFromApprover,
      (state) => {
        if (state.value === 'OperationFailed') {
          sinon.assert.calledWith(
            fakeSendTo,
            sinon.match
              .hasNested('type', 'requestRefused')
              .and(sinon.match.hasNested('receiver.role.name', 'Operator')),
            sinon.match.any
          );
          done();
        }
      }
    );
  });

  it('sends error to the right role, if there is an error creating an instance after approval', function (done) {
    let messageFromApprover = <InteractionMessage>{
      frame: {
        type: 'approved',
        messageId: 'messageId',
        receiver: {
          identification: {
            id: 'receiver-id',
            idType: 'Custom',
          },
          role: {
            name: 'central-asset-repository',
          },
        },
        semanticProtocol: 'semprot',
        sender: {
          identification: {
            id: 'sender-id',
            idType: 'Custom',
          },
          role: {
            name: 'Approver',
          },
        },
        conversationId: 'conversationId',
      },
      interactionElements: [{}],
    };

    let conversationId = 'abcd1234';
    let messageSender: MessageSender = new MessageSender(
      <AmqpClient>{},
      <IConversationMember>{},
      ''
    );
    let messageDispatcher: MyAasMessageDispatcher = new MyAasMessageDispatcher(
      messageSender
    );
    let restClient: MyExternalRestServiceCaller = new MyExternalRestServiceCaller(
      <WebClient>{},
      'data-manager'
    );
    let dbClient = makeMockDbClient();

    let fakeStoreInDb = sinon.fake.resolves({ result: 'ok' });

    sinon.replace(dbClient, 'connect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'disconnect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'update', fakeStoreInDb);
    sinon.replace(
      dbClient,
      'getOneByKey',
      sinon.fake.resolves({
        _id: conversationId,
        version: 2,
        serializedState: fs.readFileSync(
          process.cwd() +
            '/test/data/onboarding/sample-state-wait-for-approval.json',
          'utf8'
        ),
      })
    );

    let fakecreateInstanceOnCAR = sinon.fake.rejects({ status: 550 });
    sinon.replace(restClient, 'createInstanceOnCAR', fakecreateInstanceOnCAR);

    let fakeReplyTo = sinon.fake();
    sinon.replace(messageSender, 'replyTo', fakeReplyTo);

    let fakeSendTo = sinon.fake();
    sinon.replace(messageSender, 'sendTo', fakeSendTo);

    let skill: Skill = new Skill(
      new MyInitializer(messageDispatcher, restClient, {
        askForApproval: true,
      }),
      dbClient
    );

    skill.applyEvent(
      'APPROVED_FROM_APPROVER',
      conversationId,
      messageFromApprover,
      (state) => {
        if (state.value === 'OperationFailed') {
          sinon.assert.notCalled(fakeReplyTo);
          sinon.assert.calledOnce(fakecreateInstanceOnCAR);
          sinon.assert.calledWith(
            fakeSendTo,
            sinon.match
              .hasNested('type', 'error')
              .and(sinon.match.hasNested('receiver.role.name', 'Operator')),
            sinon.match.any
          );
          done();
        }
      }
    );
  });

  it('sends back a requestRefused on receipt of NOTUNDERSTOOD_FROM_APPROVER (when requestApproval is set)', function (done) {
    let messageFromApprover = <InteractionMessage>{
      frame: {
        type: 'approved',
        messageId: 'messageId',
        receiver: {
          identification: {
            id: 'receiver-id',
            idType: 'Custom',
          },
          role: {
            name: 'central-asset-repository',
          },
        },
        semanticProtocol: 'semprot',
        sender: {
          identification: {
            id: 'sender-id',
            idType: 'Custom',
          },
          role: {
            name: 'approver',
          },
        },
        conversationId: 'conversationId',
      },
      interactionElements: [{}],
    };

    let conversationId = 'abcd1234';
    let messageSender: MessageSender = new MessageSender(
      <AmqpClient>{},
      <IConversationMember>{},
      ''
    );
    let messageDispatcher: MyAasMessageDispatcher = new MyAasMessageDispatcher(
      messageSender
    );
    let dbClient = makeMockDbClient();
    let restClient: MyExternalRestServiceCaller = new MyExternalRestServiceCaller(
      <WebClient>{},
      'data-manager'
    );

    let fakeStoreInDb = sinon.fake.resolves({ result: 'ok' });

    sinon.replace(dbClient, 'connect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'disconnect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'update', fakeStoreInDb);
    sinon.replace(
      dbClient,
      'getOneByKey',
      sinon.fake.resolves({
        _id: conversationId,
        version: 2,
        serializedState: fs.readFileSync(
          process.cwd() +
            '/test/data/onboarding/sample-state-wait-for-approval.json',
          'utf8'
        ),
      })
    );

    let fakeSendTo = sinon.fake();
    sinon.replace(messageSender, 'sendTo', fakeSendTo);

    let skill: Skill = new Skill(
      new MyInitializer(messageDispatcher, restClient, {
        askForApproval: true,
      }),
      dbClient
    );

    skill.applyEvent(
      'NOTUNDERSTOOD_FROM_APPROVER',
      conversationId,
      messageFromApprover,
      (state) => {
        if (state.value === 'OperationFailed') {
          sinon.assert.calledWith(
            fakeSendTo,
            sinon.match
              .hasNested('type', 'requestRefused')
              .and(sinon.match.hasNested('receiver.role.name', 'Operator')),
            sinon.match.any
          );
          done();
        }
      }
    );
  });

  it('sends back a requestRefused on receipt of ERROR_FROM_APPROVER (when requestApproval is set)', function (done) {
    let messageFromApprover = <InteractionMessage>{
      frame: {
        type: 'approved',
        messageId: 'messageId',
        receiver: {
          identification: {
            id: 'receiver-id',
            idType: 'Custom',
          },
          role: {
            name: 'central-asset-repository',
          },
        },
        semanticProtocol: 'semprot',
        sender: {
          identification: {
            id: 'sender-id',
            idType: 'Custom',
          },
          role: {
            name: 'approver',
          },
        },
        conversationId: 'conversationId',
      },
      interactionElements: [{}],
    };

    let conversationId = 'abcd1234';
    let messageSender: MessageSender = new MessageSender(
      <AmqpClient>{},
      <IConversationMember>{},
      ''
    );
    let messageDispatcher: MyAasMessageDispatcher = new MyAasMessageDispatcher(
      messageSender
    );
    let dbClient = makeMockDbClient();
    let restClient: MyExternalRestServiceCaller = new MyExternalRestServiceCaller(
      <WebClient>{},
      'data-manager'
    );
    let fakeStoreInDb = sinon.fake.resolves({ result: 'ok' });

    sinon.replace(dbClient, 'connect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'disconnect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'update', fakeStoreInDb);
    sinon.replace(
      dbClient,
      'getOneByKey',
      sinon.fake.resolves({
        _id: conversationId,
        version: 2,
        serializedState: fs.readFileSync(
          process.cwd() +
            '/test/data/onboarding/sample-state-wait-for-approval.json',
          'utf8'
        ),
      })
    );

    let fakeSendTo = sinon.fake();
    sinon.replace(messageSender, 'sendTo', fakeSendTo);

    let skill: Skill = new Skill(
      new MyInitializer(messageDispatcher, restClient, {
        askForApproval: true,
      }),
      dbClient
    );

    skill.applyEvent(
      'ERROR_FROM_APPROVER',
      conversationId,
      messageFromApprover,
      (state) => {
        if (state.value === 'OperationFailed') {
          sinon.assert.calledWith(
            fakeSendTo,
            sinon.match
              .hasNested('type', 'requestRefused')
              .and(sinon.match.hasNested('receiver.role.name', 'Operator')),
            sinon.match.any
          );
          done();
        }
      }
    );
  });

  it('sends a notUnderstood to the right role, if there is a 400 error creating an instance after approval', function (done) {
    let messageFromApprover = <InteractionMessage>{
      frame: {
        type: 'approved',
        messageId: 'messageId',
        receiver: {
          identification: {
            id: 'receiver-id',
            idType: 'Custom',
          },
          role: {
            name: 'central-asset-repository',
          },
        },
        semanticProtocol: 'semprot',
        sender: {
          identification: {
            id: 'sender-id',
            idType: 'Custom',
          },
          role: {
            name: 'Approver',
          },
        },
        conversationId: 'conversationId',
      },
      interactionElements: [{}],
    };

    let conversationId = 'abcd1234';
    let messageSender: MessageSender = new MessageSender(
      <AmqpClient>{},
      <IConversationMember>{},
      ''
    );
    let messageDispatcher: MyAasMessageDispatcher = new MyAasMessageDispatcher(
      messageSender
    );
    let dbClient = makeMockDbClient();
    let restClient: MyExternalRestServiceCaller = new MyExternalRestServiceCaller(
      <WebClient>{},
      'data-manager'
    );
    let fakeStoreInDb = sinon.fake.resolves({ result: 'ok' });

    sinon.replace(dbClient, 'connect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'disconnect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'update', fakeStoreInDb);
    sinon.replace(
      dbClient,
      'getOneByKey',
      sinon.fake.resolves({
        _id: conversationId,
        version: 2,
        serializedState: fs.readFileSync(
          process.cwd() +
            '/test/data/onboarding/sample-state-wait-for-approval.json',
          'utf8'
        ),
      })
    );

    let fakecreateInstanceOnCAR = sinon.fake.rejects(makeRequestError(400));
    sinon.replace(restClient, 'createInstanceOnCAR', fakecreateInstanceOnCAR);

    let fakeReplyTo = sinon.fake();
    sinon.replace(messageSender, 'replyTo', fakeReplyTo);

    let fakeSendTo = sinon.fake();
    sinon.replace(messageSender, 'sendTo', fakeSendTo);

    let skill: Skill = new Skill(
      new MyInitializer(messageDispatcher, restClient, {
        askForApproval: true,
      }),
      dbClient
    );

    skill.applyEvent(
      'APPROVED_FROM_APPROVER',
      conversationId,
      messageFromApprover,
      (state) => {
        if (state.value === 'OperationFailed') {
          sinon.assert.notCalled(fakeReplyTo);
          sinon.assert.calledOnce(fakecreateInstanceOnCAR);
          sinon.assert.calledWith(
            fakeSendTo,
            sinon.match
              .hasNested('type', 'notUnderstood')
              .and(sinon.match.hasNested('receiver.role.name', 'Operator')),
            sinon.match.any
          );
          done();
        }
      }
    );
  });

  it('sends a requestRefused to the right role, if there is a 401 error creating an instance after approval', function (done) {
    let messageFromApprover = <InteractionMessage>{
      frame: {
        type: 'approved',
        messageId: 'messageId',
        receiver: {
          identification: {
            id: 'receiver-id',
            idType: 'Custom',
          },
          role: {
            name: 'central-asset-repository',
          },
        },
        semanticProtocol: 'semprot',
        sender: {
          identification: {
            id: 'sender-id',
            idType: 'Custom',
          },
          role: {
            name: 'Approver',
          },
        },
        conversationId: 'conversationId',
      },
      interactionElements: [{}],
    };

    let conversationId = 'abcd1234';
    let messageSender: MessageSender = new MessageSender(
      <AmqpClient>{},
      <IConversationMember>{},
      ''
    );
    let messageDispatcher: MyAasMessageDispatcher = new MyAasMessageDispatcher(
      messageSender
    );
    let dbClient = makeMockDbClient();
    let restClient: MyExternalRestServiceCaller = new MyExternalRestServiceCaller(
      <WebClient>{},
      'data-manager'
    );
    let fakeStoreInDb = sinon.fake.resolves({ result: 'ok' });

    sinon.replace(dbClient, 'connect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'disconnect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'update', fakeStoreInDb);
    sinon.replace(
      dbClient,
      'getOneByKey',
      sinon.fake.resolves({
        _id: conversationId,
        version: 2,
        serializedState: fs.readFileSync(
          process.cwd() +
            '/test/data/onboarding/sample-state-wait-for-approval.json',
          'utf8'
        ),
      })
    );

    let fakecreateInstanceOnCAR = sinon.fake.rejects(makeRequestError(401));
    sinon.replace(restClient, 'createInstanceOnCAR', fakecreateInstanceOnCAR);

    let fakeReplyTo = sinon.fake();
    sinon.replace(messageSender, 'replyTo', fakeReplyTo);

    let fakeSendTo = sinon.fake();
    sinon.replace(messageSender, 'sendTo', fakeSendTo);

    let skill: Skill = new Skill(
      new MyInitializer(messageDispatcher, restClient, {
        askForApproval: true,
      }),
      dbClient
    );

    skill.applyEvent(
      'APPROVED_FROM_APPROVER',
      conversationId,
      messageFromApprover,
      (state) => {
        if (state.value === 'OperationFailed') {
          sinon.assert.notCalled(fakeReplyTo);
          sinon.assert.calledOnce(fakecreateInstanceOnCAR);
          sinon.assert.calledWith(
            fakeSendTo,
            sinon.match
              .hasNested('type', 'requestRefused')
              .and(sinon.match.hasNested('receiver.role.name', 'Operator')),
            sinon.match.any
          );
          done();
        }
      }
    );
  });

  it('sends a error to the right role, if there is a 500 error creating an instance after approval', function (done) {
    let messageFromApprover = <InteractionMessage>{
      frame: {
        type: 'approved',
        messageId: 'messageId',
        receiver: {
          identification: {
            id: 'receiver-id',
            idType: 'Custom',
          },
          role: {
            name: 'central-asset-repository',
          },
        },
        semanticProtocol: 'semprot',
        sender: {
          identification: {
            id: 'sender-id',
            idType: 'Custom',
          },
          role: {
            name: 'Approver',
          },
        },
        conversationId: 'conversationId',
      },
      interactionElements: [{}],
    };

    let conversationId = 'abcd1234';
    let messageSender: MessageSender = new MessageSender(
      <AmqpClient>{},
      <IConversationMember>{},
      ''
    );
    let messageDispatcher: MyAasMessageDispatcher = new MyAasMessageDispatcher(
      messageSender
    );
    let restClient: MyExternalRestServiceCaller = new MyExternalRestServiceCaller(
      <WebClient>{},
      'data-manager'
    );
    let dbClient = makeMockDbClient();

    let fakeStoreInDb = sinon.fake.resolves({ result: 'ok' });

    sinon.replace(dbClient, 'connect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'disconnect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'update', fakeStoreInDb);
    sinon.replace(
      dbClient,
      'getOneByKey',
      sinon.fake.resolves({
        _id: conversationId,
        version: 2,
        serializedState: fs.readFileSync(
          process.cwd() +
            '/test/data/onboarding/sample-state-wait-for-approval.json',
          'utf8'
        ),
      })
    );

    let fakecreateInstanceOnCAR = sinon.fake.rejects(makeRequestError(500));
    sinon.replace(restClient, 'createInstanceOnCAR', fakecreateInstanceOnCAR);

    let fakeReplyTo = sinon.fake();
    sinon.replace(messageSender, 'replyTo', fakeReplyTo);

    let fakeSendTo = sinon.fake();
    sinon.replace(messageSender, 'sendTo', fakeSendTo);

    let skill: Skill = new Skill(
      new MyInitializer(messageDispatcher, restClient, {
        askForApproval: true,
      }),
      dbClient
    );

    skill.applyEvent(
      'APPROVED_FROM_APPROVER',
      conversationId,
      messageFromApprover,
      (state) => {
        if (state.value === 'OperationFailed') {
          sinon.assert.notCalled(fakeReplyTo);
          sinon.assert.calledOnce(fakecreateInstanceOnCAR);
          sinon.assert.calledWith(
            fakeSendTo,
            sinon.match
              .hasNested('type', 'error')
              .and(sinon.match.hasNested('receiver.role.name', 'Operator')),
            sinon.match.any
          );
          done();
        }
      }
    );
  });

  it('moves into WaitingForType if requestType is set, sending out the correct messages', function (done) {
    let conversationId = 'abcd1234';
    let messageDispatcher: MyAasMessageDispatcher = new MyAasMessageDispatcher(
      <IMessageSender>{}
    );
    let dbClient = makeMockDbClient();
    let restClient: MyExternalRestServiceCaller = new MyExternalRestServiceCaller(
      <WebClient>{},
      'data-manager'
    );
    let fakeStoreInDb = sinon.fake.resolves({ result: 'ok' });
    sinon.replace(dbClient, 'connect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'disconnect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'update', fakeStoreInDb);
    sinon.replace(dbClient, 'getOneByKey', sinon.fake.resolves(null));

    let fakerequestTypeFromManufacturer = sinon.fake();
    sinon.replace(
      messageDispatcher,
      'requestTypeFromManufacturer',
      fakerequestTypeFromManufacturer
    );

    let fakesendResponseInstanceToOperator = sinon.fake();
    sinon.replace(
      messageDispatcher,
      'sendResponseInstanceToOperator',
      fakesendResponseInstanceToOperator
    );

    let fakecreateInstanceOnCAR = sinon.fake.resolves({ status: 200 });
    sinon.replace(restClient, 'createInstanceOnCAR', fakecreateInstanceOnCAR);

    let skill: Skill = new Skill(
      new MyInitializer(messageDispatcher, restClient, {
        askForType: true,
      }),
      dbClient
    );

    skill.applyEvent(
      'PUBLISHINSTANCE_FROM_OPERATOR',
      conversationId,
      message,
      (state) => {
        if (state.value === 'WaitingForType') {
          sinon.assert.calledOnce(fakerequestTypeFromManufacturer);
          sinon.assert.calledOnce(fakesendResponseInstanceToOperator);
          done();
        }
      }
    );
  });

  it('switches sender to receiver when replying to a message', async function () {
    let conversationId = 'abcd1234';
    let amqpClient = new AmqpClient('a', 'a1', 'b', 'c', 'd', '');
    let messageDispatcher: MyAasMessageDispatcher = new MyAasMessageDispatcher(
      new MessageSender(
        amqpClient,
        {
          identification: {
            id: 'myUri',
            idType: 'Custom',
          },
          role: {
            name: 'myRole',
          },
        },
        'routingKey'
      )
    );
    let restClient: MyExternalRestServiceCaller = new MyExternalRestServiceCaller(
      <WebClient>{},
      'data-manager'
    );
    let dbClient = makeMockDbClient();
    sinon.replace(dbClient, 'connect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'disconnect', sinon.fake.resolves({}));
    sinon.replace(
      dbClient,
      'getOneByKey',
      sinon.fake.returns({
        _id: conversationId,
        version: 2,
        serializedState: fs.readFileSync(
          process.cwd() + '/test/data/onboarding/sample-state-record.json',
          'utf8'
        ),
      })
    );

    let fakePublish = sinon.fake();
    sinon.replace(amqpClient, 'publish', fakePublish);

    let skill: Skill = new Skill(
      new MyInitializer(messageDispatcher, restClient, {}),
      dbClient
    );

    await skill.applyEvent(
      'NOTUNDERSTOOD_FROM_OPERATOR',
      conversationId,
      message
    );
    sinon.assert.calledWith(
      fakePublish,
      sinon.match.any,
      sinon.match('"receiver":{"identification":{"id":"sender-id"')
    );
  });

  it('sends out not understood if it receives a publish instance message when in state InstancePublished', async function () {
    let conversationId = 'abcd1234';
    let messageDispatcher: MyAasMessageDispatcher = new MyAasMessageDispatcher(
      <IMessageSender>{}
    );
    let restClient: MyExternalRestServiceCaller = new MyExternalRestServiceCaller(
      <WebClient>{},
      'data-manager'
    );
    let dbClient = makeMockDbClient();
    sinon.replace(dbClient, 'connect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'disconnect', sinon.fake.resolves({}));
    sinon.replace(
      dbClient,
      'getOneByKey',
      sinon.fake.returns({
        _id: conversationId,
        version: 2,
        serializedState: fs.readFileSync(
          process.cwd() + '/test/data/onboarding/sample-state-final.json',
          'utf8'
        ),
      })
    );

    let fakereplyNotUnderstood = sinon.fake();
    sinon.replace(
      messageDispatcher,
      'replyNotUnderstood',
      fakereplyNotUnderstood
    );

    let skill: Skill = new Skill(
      new MyInitializer(messageDispatcher, restClient, {}),
      dbClient
    );

    await skill.applyEvent(
      'PUBLISHINSTANCE_FROM_OPERATOR',
      conversationId,
      message
    );
    sinon.assert.calledOnce(fakereplyNotUnderstood);
  });

  it('sends out not understood if it receives an illegal interaction', async function () {
    let conversationId = 'abcd1234';
    let messageDispatcher: MyAasMessageDispatcher = new MyAasMessageDispatcher(
      <IMessageSender>{}
    );
    let restClient: MyExternalRestServiceCaller = new MyExternalRestServiceCaller(
      <WebClient>{},
      'data-manager'
    );
    let dbClient = makeMockDbClient();
    sinon.replace(dbClient, 'connect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'disconnect', sinon.fake.resolves({}));
    sinon.replace(
      dbClient,
      'getOneByKey',
      sinon.fake.returns({
        _id: conversationId,
        version: 2,
        serializedState: fs.readFileSync(
          process.cwd() +
            '/test/data/onboarding/sample-state-record-intermediate.json',
          'utf8'
        ),
      })
    );

    let fakereplyNotUnderstood = sinon.fake();
    sinon.replace(
      messageDispatcher,
      'replyNotUnderstood',
      fakereplyNotUnderstood
    );

    let skill: Skill = new Skill(
      new MyInitializer(messageDispatcher, restClient, {}),
      dbClient
    );

    await skill.applyEvent(
      'NOTUNDERSTOOD_FROM_OPERATOR',
      conversationId,
      message
    );
    sinon.assert.calledOnce(fakereplyNotUnderstood);
  });

  it('reacts correctly if a state is loaded from persistent store', function (done) {
    let conversationId = 'abcd1234';
    let messageSender: MessageSender = new MessageSender(
      <AmqpClient>{},
      <IConversationMember>{},
      ''
    );
    let messageDispatcher: MyAasMessageDispatcher = new MyAasMessageDispatcher(
      messageSender
    );
    let restClient: MyExternalRestServiceCaller = new MyExternalRestServiceCaller(
      <WebClient>{},
      'data-manager'
    );
    let dbClient = makeMockDbClient();
    sinon.replace(dbClient, 'connect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'disconnect', sinon.fake.resolves({}));
    sinon.replace(
      dbClient,
      'getOneByKey',
      sinon.fake.returns({
        _id: conversationId,
        version: 2,
        serializedState: fs.readFileSync(
          process.cwd() +
            '/test/data/onboarding/sample-state-record-intermediate.json',
          'utf8'
        ),
      })
    );
    sinon.replace(dbClient, 'update', sinon.fake());
    let fakeSendTo = sinon.fake();
    sinon.replace(messageSender, 'sendTo', fakeSendTo);

    let skill: Skill = new Skill(
      new MyInitializer(messageDispatcher, restClient, {
        askForType: true,
      }),
      dbClient
    );

    skill.applyEvent(
      'RESPONSETYPE_FROM_MANUFACTURER',
      conversationId,
      message,
      (state) => {
        if (state.value === 'InstanceAndTypePublished') {
          expect(fakeSendTo.called).to.be.true;
          sinon.assert.calledWith(
            fakeSendTo,
            sinon.match.hasNested('type', 'responseType'),
            sinon.match.any
          );
          done();
        }
      }
    );
  });

  it('does not send out a responseInstance if there was an error in writing to the database after entering InstancePublished', function (done) {
    let conversationId = 'abcd1234';
    let messageDispatcher: MyAasMessageDispatcher = new MyAasMessageDispatcher(
      <IMessageSender>{}
    );
    let restClient: MyExternalRestServiceCaller = new MyExternalRestServiceCaller(
      <WebClient>{},
      'data-manager'
    );
    let dbClient = makeMockDbClient();

    let fakeStoreInDb = sinon.fake.rejects({ result: 'error' });
    sinon.replace(dbClient, 'connect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'disconnect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'update', fakeStoreInDb);
    sinon.replace(dbClient, 'getOneByKey', sinon.fake.returns(null));

    let fakesendResponseInstanceToOperator = sinon.fake();
    sinon.replace(
      messageDispatcher,
      'sendResponseInstanceToOperator',
      fakesendResponseInstanceToOperator
    );

    let fakeSendError = sinon.fake();
    sinon.replace(messageDispatcher, 'replyError', fakeSendError);

    let fakecreateInstanceOnCAR = sinon.fake.resolves({ status: 200 });
    sinon.replace(restClient, 'createInstanceOnCAR', fakecreateInstanceOnCAR);

    let skill: Skill = new Skill(
      new MyInitializer(messageDispatcher, restClient, {}),
      dbClient
    );

    skill.applyEvent(
      'PUBLISHINSTANCE_FROM_OPERATOR',
      conversationId,
      message,
      () => {},
      (state) => {
        if (state.value === 'InstancePublished') {
          sinon.assert.notCalled(fakesendResponseInstanceToOperator);
          sinon.assert.called(fakeSendError);
          done();
        }
      }
    );
  });

  it('responds with notUnderstood if a 400 error takes place in creating an instance', function (done) {
    let conversationId = 'abcd1234';
    let messageSender: MessageSender = new MessageSender(
      <AmqpClient>{},
      <IConversationMember>{},
      ''
    );
    let messageDispatcher: MyAasMessageDispatcher = new MyAasMessageDispatcher(
      messageSender
    );
    let restClient: MyExternalRestServiceCaller = new MyExternalRestServiceCaller(
      new WebClient('http://base.com', 'user', 'password'),
      'data-manager'
    );
    let dbClient = makeMockDbClient();

    let fakeStoreInDb = sinon.fake();
    sinon.replace(dbClient, 'connect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'disconnect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'update', fakeStoreInDb);
    sinon.replace(dbClient, 'getOneByKey', sinon.fake.returns(null));

    let fakesendResponseInstanceToOperator = sinon.fake();
    sinon.replace(
      messageDispatcher,
      'sendResponseInstanceToOperator',
      fakesendResponseInstanceToOperator
    );

    let sendTo = sinon.fake();
    sinon.replace(messageSender, 'sendTo', sendTo);

    let fakePost = sinon.fake.rejects(makeRequestError(400));
    sinon.replace(Axios, 'post', fakePost);

    let skill: Skill = new Skill(
      new MyInitializer(messageDispatcher, restClient, {}),
      dbClient
    );

    skill.applyEvent(
      'PUBLISHINSTANCE_FROM_OPERATOR',
      conversationId,
      message,
      (state) => {
        if (state.value === 'OperationFailed') {
          sinon.assert.notCalled(fakesendResponseInstanceToOperator);
          sinon.assert.calledWith(
            sendTo,
            sinon.match.hasNested('type', 'notUnderstood'),
            sinon.match.any
          );
          done();
        }
      }
    );
  });

  it('responds with requestRefused in case it receives a 401 from the storage adapter', function (done) {
    let conversationId = 'abcd1234';
    let messageSender: MessageSender = new MessageSender(
      <AmqpClient>{},
      <IConversationMember>{},
      ''
    );
    let messageDispatcher: MyAasMessageDispatcher = new MyAasMessageDispatcher(
      messageSender
    );
    let restClient: MyExternalRestServiceCaller = new MyExternalRestServiceCaller(
      <WebClient>{},
      'data-manager'
    );
    let dbClient = makeMockDbClient();

    sinon.replace(dbClient, 'connect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'disconnect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'update', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'getOneByKey', sinon.fake.returns(null));

    let fakecreateInstanceOnCAR = sinon.fake.rejects(makeRequestError(401));
    sinon.replace(restClient, 'createInstanceOnCAR', fakecreateInstanceOnCAR);

    let sendTo = sinon.fake();
    sinon.replace(messageSender, 'sendTo', sendTo);

    let fakesendResponseInstanceToOperator = sinon.fake();
    sinon.replace(
      messageDispatcher,
      'sendResponseInstanceToOperator',
      fakesendResponseInstanceToOperator
    );

    let skill: Skill = new Skill(
      new MyInitializer(messageDispatcher, restClient, {}),
      dbClient
    );

    skill.applyEvent(
      'PUBLISHINSTANCE_FROM_OPERATOR',
      conversationId,
      message,
      (state) => {
        if (state.value === 'OperationFailed') {
          sinon.assert.calledWith(
            sendTo,
            sinon.match.hasNested('type', 'requestRefused'),
            sinon.match.any
          );
          sinon.assert.notCalled(fakesendResponseInstanceToOperator);
          done();
        }
      }
    );
  });

  it('responds with error in case it receives a 500 from the storage adapter', function (done) {
    let conversationId = 'abcd1234';
    let messageSender: MessageSender = new MessageSender(
      <AmqpClient>{},
      <IConversationMember>{},
      ''
    );
    let messageDispatcher: MyAasMessageDispatcher = new MyAasMessageDispatcher(
      messageSender
    );
    let dbClient = makeMockDbClient();
    let restClient: MyExternalRestServiceCaller = new MyExternalRestServiceCaller(
      <WebClient>{},
      'data-manager'
    );
    sinon.replace(dbClient, 'connect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'disconnect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'update', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'getOneByKey', sinon.fake.returns(null));

    let fakecreateInstanceOnCAR = sinon.fake.rejects(makeRequestError(500));
    sinon.replace(restClient, 'createInstanceOnCAR', fakecreateInstanceOnCAR);

    let sendTo = sinon.fake();
    sinon.replace(messageSender, 'sendTo', sendTo);

    let skill: Skill = new Skill(
      new MyInitializer(messageDispatcher, restClient, {}),
      dbClient
    );

    skill.applyEvent(
      'PUBLISHINSTANCE_FROM_OPERATOR',
      conversationId,
      message,
      (state) => {
        if (state.value === 'OperationFailed') {
          sinon.assert.calledWith(
            sendTo,
            sinon.match.hasNested('type', 'error'),
            sinon.match.any
          );
          done();
        }
      }
    );
  });

  it('replies with an error to whoever sent the last message if a programming error occurs during transition', async function () {
    let conversationId = 'abcd1234';
    let messageSender: MessageSender = new MessageSender(
      <AmqpClient>{},
      <IConversationMember>{},
      ''
    );
    let messageDispatcher: MyAasMessageDispatcher = new MyAasMessageDispatcher(
      messageSender
    );
    let dbClient = makeMockDbClient();
    let restClient: MyExternalRestServiceCaller = new MyExternalRestServiceCaller(
      <WebClient>{},
      'data-manager'
    );
    sinon.replace(dbClient, 'connect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'disconnect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'update', sinon.fake.resolves({}));
    sinon.replace(
      dbClient,
      'getOneByKey',
      sinon.fake.returns({
        _id: conversationId,
        version: 2,
        serializedState: fs.readFileSync(
          process.cwd() +
            '/test/data/onboarding/sample-state-record-intermediate.json',
          'utf8'
        ),
      })
    );

    let fakereplyError = sinon.fake();
    sinon.replace(messageDispatcher, 'replyError', fakereplyError);

    //TODO: in future it should inform the initiator/operator
    //let sendTo = sinon.fake();
    //sinon.replace(messageSender, "sendTo", sendTo);

    let skill: Skill = new Skill(
      new MyInitializer(messageDispatcher, restClient, {}),
      dbClient
    );
    let fakecreateAndStartMaschineServiceFromPreviousWithCurrentContext = sinon.fake.throws(
      new Error()
    );
    sinon.replace(
      <any>skill,
      'createAndStartMaschineServiceFromPreviousWithCurrentContext',
      fakecreateAndStartMaschineServiceFromPreviousWithCurrentContext
    );

    var test = await skill.applyEvent(
      'PUBLISHINSTANCE_FROM_OPERATOR',
      conversationId,
      message
    );
    sinon.assert.called(fakereplyError);
    /*
    sinon.assert.calledWith(
      sendTo,
      sinon.match
        .hasNested("type", "error")
        .and(sinon.match.hasNested("receiver.role.name", "Operator"))
    );*/
  });

  it('moves into InstancePublished if the manufacturer refuses the type request', function (done) {
    let conversationId = 'abcd1234';
    let messageSender: MessageSender = new MessageSender(
      <AmqpClient>{},
      <IConversationMember>{},
      ''
    );
    let messageDispatcher: MyAasMessageDispatcher = new MyAasMessageDispatcher(
      messageSender
    );
    let restClient: MyExternalRestServiceCaller = new MyExternalRestServiceCaller(
      <WebClient>{},
      'data-manager'
    );
    let dbClient = makeMockDbClient();

    sinon.replace(dbClient, 'connect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'disconnect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'update', sinon.fake.resolves({}));
    sinon.replace(
      dbClient,
      'getOneByKey',
      sinon.fake.returns({
        _id: conversationId,
        version: 2,
        serializedState: fs.readFileSync(
          process.cwd() +
            '/test/data/onboarding/sample-state-record-intermediate.json',
          'utf8'
        ),
      })
    );

    let sendTo = sinon.fake();
    sinon.replace(messageSender, 'sendTo', sendTo);

    let skill: Skill = new Skill(
      new MyInitializer(messageDispatcher, restClient, {}),
      dbClient
    );

    skill.applyEvent(
      'REQUESTREFUSED_FROM_MANUFACTURER',
      conversationId,
      message,
      (state) => {
        if (state.value === 'InstancePublished') {
          done();
        } else {
          done('Wrong state transition.');
        }
      }
    );
  });

  it('moves into InstancePublished if the manufacturer replies with notUnderstood', function (done) {
    let conversationId = 'abcd1234';
    let messageSender: MessageSender = new MessageSender(
      <AmqpClient>{},
      <IConversationMember>{},
      ''
    );
    let messageDispatcher: MyAasMessageDispatcher = new MyAasMessageDispatcher(
      messageSender
    );
    let dbClient = makeMockDbClient();
    let restClient: MyExternalRestServiceCaller = new MyExternalRestServiceCaller(
      <WebClient>{},
      'data-manager'
    );
    sinon.replace(dbClient, 'connect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'disconnect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'update', sinon.fake.resolves({}));
    sinon.replace(
      dbClient,
      'getOneByKey',
      sinon.fake.returns({
        _id: conversationId,
        version: 2,
        serializedState: fs.readFileSync(
          process.cwd() +
            '/test/data/onboarding/sample-state-record-intermediate.json',
          'utf8'
        ),
      })
    );

    let sendTo = sinon.fake();
    sinon.replace(messageSender, 'sendTo', sendTo);

    let skill: Skill = new Skill(
      new MyInitializer(messageDispatcher, restClient, {}),
      dbClient
    );

    skill.applyEvent(
      'NOTUNDERSTOOD_FROM_MANUFACTURER',
      conversationId,
      message,
      (state) => {
        if (state.value === 'InstancePublished') {
          done();
        } else {
          done('Wrong state transition.');
        }
      }
    );
  });
  it('moves into InstancePublished if the manufacturer replies with error', function (done) {
    let conversationId = 'abcd1234';
    let messageSender: MessageSender = new MessageSender(
      <AmqpClient>{},
      <IConversationMember>{},
      ''
    );
    let messageDispatcher: MyAasMessageDispatcher = new MyAasMessageDispatcher(
      messageSender
    );
    let dbClient = makeMockDbClient();
    let restClient: MyExternalRestServiceCaller = new MyExternalRestServiceCaller(
      <WebClient>{},
      'data-manager'
    );
    sinon.replace(dbClient, 'connect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'disconnect', sinon.fake.resolves({}));
    sinon.replace(dbClient, 'update', sinon.fake.resolves({}));
    sinon.replace(
      dbClient,
      'getOneByKey',
      sinon.fake.returns({
        _id: conversationId,
        version: 2,
        serializedState: fs.readFileSync(
          process.cwd() +
            '/test/data/onboarding/sample-state-record-intermediate.json',
          'utf8'
        ),
      })
    );

    let sendTo = sinon.fake();
    sinon.replace(messageSender, 'sendTo', sendTo);

    let skill: Skill = new Skill(
      new MyInitializer(messageDispatcher, restClient, {}),
      dbClient
    );

    skill.applyEvent(
      'ERROR_FROM_MANUFACTURER',
      conversationId,
      message,
      (state) => {
        if (state.value === 'InstancePublished') {
          done();
        } else {
          done('Wrong state transition.');
        }
      }
    );
  });
});
