import { MachineOptions, EventObject, Machine, assign } from 'xstate';

import { logger } from '../../log';
import { ISkillContext } from '../../base/statemachineinterface/ISkillContext';

//TODO:
//the state machine could be specified such that any error/notUnderstood from a third party
//such as manufacturer or approver
//leads to
//OperationFailed, resulting in a message sent to the operator
//this is currently not the case
class MySkillStateMachineSpecification {
  private readonly machineDescription = {
    id: 'onboarding-central-asset-repository',
    initial: 'WaitingForOnboardingRequest',
    strict: true,
    states: {
      WaitingForOnboardingRequest: {
        on: {
          PUBLISHINSTANCE_FROM_OPERATOR: [
            {
              cond: 'notRequestApproval',
              target: 'CreatingInstance'
            },
            {
              cond: 'requestApproval',
              target: 'WaitingForApproval',
              actions: ['requestApprovalFromApprover']
            }
          ]
        }
      },
      WaitingForApproval: {
        on: {
          APPROVED_FROM_APPROVER: {
            target: 'CreatingInstance'
          },
          REQUESTREFUSED_FROM_APPROVER: {
            target: 'OperationFailed',
            actions: ['sendRequestRefusedToOperator']
          },
          NOTUNDERSTOOD_FROM_APPROVER: {
            target: 'OperationFailed',
            actions: ['sendRequestRefusedToOperator']
          },
          ERROR_FROM_APPROVER: {
            target: 'OperationFailed',
            actions: ['sendRequestRefusedToOperator']
          }
        }
      },
      CreatingInstance: {
        invoke: {
          id: 'create-instance-promise',
          src: 'createInstance',
          onDone: [
            {
              target: 'InstancePublished',
              cond: 'notRequestType',
              actions: 'sendResponseInstanceToOperator'
            },
            {
              target: 'WaitingForType',
              cond: 'requestType',
              actions: 'sendResponseToOperatorAndRequestType'
            }
          ],
          onError: {
            target: 'OperationFailed',
            actions: 'sendCreationErrorToOperator'
          }
        }
      },
      InstancePublished: {
        type: 'final'
      },
      InstanceAndTypePublished: {
        type: 'final'
      },
      OperationFailed: {
        type: 'final'
      },
      WaitingForType: {
        on: {
          RESPONSETYPE_FROM_MANUFACTURER: {
            target: 'InstanceAndTypePublished',
            actions: ['sendResponseTypeToOperator']
          },
          NOTUNDERSTOOD_FROM_MANUFACTURER: {
            target: 'InstancePublished'
          },
          ERROR_FROM_MANUFACTURER: {
            target: 'InstancePublished'
          },
          REQUESTREFUSED_FROM_MANUFACTURER: {
            target: 'InstancePublished'
          }
        }
      }
    }
  };

  private readonly options: Partial<
    MachineOptions<ISkillContext, EventObject>
  > = {
    services: {
      createInstance: async (context: any, event: any) => {
        logger.debug('service createInstance called');
        await context.actionMap.createInstance(context, event);
      }
    },
    guards: {
      notRequestType: (context: any, event: any) => {
        return !context.configuration['askForType'];
      },
      requestType: (context: any, event: any) => {
        return context.configuration['askForType'];
      },
      notRequestApproval: (context: any, event: any) => {
        return !context.configuration['askForApproval'];
      },
      requestApproval: (context: any, event: any) => {
        return context.configuration['askForApproval'];
      }
    },
    actions: {
      sendCreationErrorToOperator: (context: any, event: any) =>
        context.actionMap.sendCreationErrorToOperator(context, event),
      sendResponseToOperatorAndRequestType: (context: any, event: any) =>
        context.actionMap.sendResponseToOperatorAndRequestType(context, event),
      //only send back response
      sendResponseInstanceToOperator: (context, event) =>
        context.actionMap.sendResponseInstanceToOperator(context, event),
      sendRequestRefusedToOperator: (context, event) =>
        context.actionMap.sendRequestRefusedToOperator(context, event),

      sendErrorToOperator: (context, event) =>
        context.actionMap.sendErrorToOperator(context, event),

      sendResponseTypeToOperator: (context, event) =>
        context.actionMap.sendResponseTypeToOperator(context, event),

      requestApprovalFromApprover: (context, event) =>
        context.actionMap.requestApprovalFromApprover(context, event)
    }
  };

  getNewStateMachine() {
    return Machine(this.machineDescription, this.options);
  }
}

export { MySkillStateMachineSpecification };
