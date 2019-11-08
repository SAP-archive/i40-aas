import { MachineOptions, EventObject, Machine, assign } from "xstate";

import { ISkillContext } from "./statemachineinterface/ISkillContext";

import { logger } from "../../log";

//TODO: if instance created and request type from manufactuer failed
//what should be the best response to the initiator?
//how does the receiver know that the requestRefused message refers to
//the type request?
//(the operator gets two responses for one request)
class SkillStateMachineSpecification {
  private readonly machineDescription = {
    id: "onboarding-central-asset-repository",
    initial: "WaitingForOnboardingRequest",
    strict: true,
    states: {
      WaitingForOnboardingRequest: {
        on: {
          PUBLISHINSTANCE_FROM_OPERATOR: [
            {
              cond: "notRequestApproval",
              target: "CreatingInstance"
            },
            {
              cond: "requestApproval",
              target: "WaitingForApproval",
              actions: ["requestApprovalFromApprover"]
            }
          ]
        }
      },
      WaitingForApproval: {
        on: {
          APPROVED_FROM_APPROVER: {
            target: "CreatingInstance"
          },
          REQUESTREFUSED_FROM_APPROVER: {
            target: "OperationFailed",
            actions: ["sendRequestRefusedToOperator"]
          }
        }
      },
      CreatingInstance: {
        invoke: {
          id: "create-instance-promise",
          src: "createInstance",
          onDone: [
            {
              target: "InstancePublished",
              cond: "notRequestType",
              actions: "sendResponseInstanceToOperator"
            },
            {
              target: "WaitingForType",
              cond: "requestType",
              actions: "sendResponseToOperatorAndRequestType"
            }
          ],
          onError: {
            target: "OperationFailed",
            actions: "sendCreationErrorToOperator"
          }
        }
      },
      InstancePublished: {
        type: "final"
      },
      InstanceAndTypePublished: {
        type: "final"
      },
      OperationFailed: {
        type: "final"
      },
      WaitingForType: {
        on: {
          RESPONSETYPE_FROM_MANUFACTURER: {
            target: "InstanceAndTypePublished",
            actions: ["sendResponseTypeToOperator"]
          },
          NOTUNDERSTOOD_FROM_MANUFACTURER: {
            target: "OperationFailed",
            actions: ["sendErrorToOperator"]
          },
          ERROR_FROM_MANUFACTURER: {
            target: "OperationFailed",
            actions: ["sendErrorToOperator"]
          },
          REQUESTREFUSED_FROM_MANUFACTURER: {
            target: "OperationFailed",
            actions: ["sendRequestRefusedToOperator"]
          }
        }
      }
    }
  };

  private readonly options: Partial<
    MachineOptions<ISkillContext, EventObject>
  > = {
    services: {
      createInstance: (context: any, event: any) => {
        logger.debug("service createInstance called");
        return context.actionMap.createInstance(context, event);
      }
    },
    guards: {
      notRequestType: (context: any, event: any) => {
        return !context.askForType;
      },
      requestType: (context: any, event: any) => {
        return context.askForType;
      },
      notRequestApproval: (context: any, event: any) => {
        return !context.askForApproval;
      },
      requestApproval: (context: any, event: any) => {
        return context.askForApproval;
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

export { SkillStateMachineSpecification as SkillStateMachine };
