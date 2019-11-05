import { interpret, State, Interpreter, EventObject } from "xstate";
import * as logger from "winston";

import { IDatabaseClient } from "./persistenceinterface/IDatabaseClient";
import { IStateRecord } from "./persistenceinterface/IStateRecord";
import { SkillStateMachine } from "./SkillStateMachineSpecification";
import { ISkillContext } from "./statemachineinterface/ISkillContext";
import { IMessageDispatcher } from "./messaginginterface/IMessageDispatcher";

import { SkillActionMap } from "./SkillActionMap";
import { DeferredMessageDispatcher } from "../../messaging/DeferredMessageDisptacher";
import * as _ from "lodash";
import { InteractionMessage } from "i40-aas-objects";

class AssetRepositoryOnboardingSkill {
  private readonly stateMachineSpecification: SkillStateMachine = new SkillStateMachine();

  constructor(
    private messageDispatcher: IMessageDispatcher,
    private dbClient: IDatabaseClient
  ) {}

  receivedUnintelligibleMessage(message: InteractionMessage): void {
    this.messageDispatcher.replyNotUnderstood(message);
  }

  preprocessingError(message: InteractionMessage): void {
    this.messageDispatcher.replyError(message);
  }

  private async getPreviousStateFromDb(
    conversationId: string
  ): Promise<IStateRecord | null> {
    await this.dbClient.connect();
    let stateRecord: IStateRecord | null = await this.dbClient.getOneByKey({
      _id: conversationId
    });
    return stateRecord;
  }

  private deserializeStateFromRecord(
    stateRecord: IStateRecord
  ): State<ISkillContext, any> {
    let stateDefinition: any = JSON.parse(stateRecord.serializedState);
    return State.create(stateDefinition);
  }

  private createAndStartMaschineServiceFromPreviousWithCurrentContext(
    previousState: State<ISkillContext, any>,
    context: ISkillContext
  ): Interpreter<ISkillContext, any, EventObject> {
    let onboardingSkillMachine = this.stateMachineSpecification.getNewStateMachine();
    const resolvedState = onboardingSkillMachine.resolveState(previousState);
    resolvedState.context = context;
    const service = interpret(onboardingSkillMachine).start(resolvedState);
    return service;
  }

  private static isInvalidTransition(error: any): boolean {
    if ((error.message as string).includes("does not accept event"))
      return true;
    else return false;
  }

  private prepareContext(
    message: InteractionMessage,
    messageDispatcher: IMessageDispatcher
  ): ISkillContext {
    return {
      message: message,
      actionMap: new SkillActionMap(messageDispatcher),
      askForApproval: process.env.REQUEST_APPROVAL
        ? eval(process.env.REQUEST_APPROVAL)
        : false,
      askForType: process.env.REQUEST_TYPE
        ? eval(process.env.REQUEST_TYPE)
        : false
    };
  }

  private removeNonPersistentPartsOfState(
    state: State<ISkillContext, EventObject>
  ) {
    let stateClone = _.cloneDeep(state);
    stateClone.context = <ISkillContext>{};
    if (stateClone.history) stateClone.history.context = <ISkillContext>{};
    if (stateClone.event) {
      if ((stateClone.event as any).data) (stateClone.event as any).data = {};
    }
    if (stateClone.history) stateClone.history.context = <ISkillContext>{};
    return stateClone;
  }

  async applyEvent(
    event: string,
    conversationId: string,
    message: InteractionMessage,
    fnOnTransitionDone?: (state: State<ISkillContext, EventObject>) => void,
    fnOnTransitionError?: (state: State<ISkillContext, EventObject>) => void
  ) {
    //TODO: should be injected
    let deferredMessageDispatcher = new DeferredMessageDispatcher(
      this.messageDispatcher
    );
    let context = this.prepareContext(message, deferredMessageDispatcher);

    try {
      let previousStateRecord: IStateRecord | null = await this.getPreviousStateFromDb(
        conversationId
      );
      let onboardingService: Interpreter<ISkillContext, any, EventObject>;
      if (previousStateRecord) {
        onboardingService = this.createAndStartMaschineServiceFromPreviousWithCurrentContext(
          this.deserializeStateFromRecord(previousStateRecord),
          context
        );
        if (!onboardingService.initialized) {
          //if the machine was loaded with a final state and shut down
          //respond with not understood
          //apparently the client is trying to access a closed conversation
          logger.debug(
            "This interaction refers to a previously closed conversation."
          );
          this.messageDispatcher.replyNotUnderstood(message);
          return;
        }
      } else {
        let onboardingSkillMachine = this.stateMachineSpecification.getNewStateMachine();
        onboardingService = interpret(
          onboardingSkillMachine.withContext(context)
        ).start();
      }
      let versionCounter = previousStateRecord
        ? previousStateRecord.version
        : 0;

      //TODO: move out for better readability
      //TODO: does this need to be set for each and every event? yes
      onboardingService.onTransition(async state => {
        logger.debug("Transitioned to " + JSON.stringify(state.value));
        if (!state.changed) return;
        //TODO: database will be written to if the state was loaded
        //but happens to be a final state, i.e. is the same as in
        //the db. No need to write it then.
        try {
          let stateClone = this.removeNonPersistentPartsOfState(state);
          const result = await this.dbClient.update(
            {
              _id: conversationId,
              version: versionCounter++
            }, //find by
            {
              //update these
              serializedState: JSON.stringify(stateClone)
            },
            true //increment version
          );
          logger.debug("db updated:" + JSON.stringify(result));
          deferredMessageDispatcher.commit();
          if (fnOnTransitionDone) fnOnTransitionDone(state);
        } catch (error) {
          logger.error(
            "The database cannot be written to. More specific:" + error.message
          );
          logger.error(error.stack);
          //only respond to external trigger (once)
          if (state.event.type === event)
            this.messageDispatcher.replyError(message);
          if (fnOnTransitionError) fnOnTransitionError(state);
        }
      });

      onboardingService.send(event);
    } catch (error) {
      logger.error("The transition could not take place:" + error);
      if (!context.message) {
        logger.error(
          "Asset repository skill cannot is missing in its context the message to reply to with an error!"
        );
      } else if (AssetRepositoryOnboardingSkill.isInvalidTransition(error)) {
        this.messageDispatcher.replyNotUnderstood(context.message);
      } else {
        this.messageDispatcher.replyError(context.message);
      }
    }
  }
}

export { AssetRepositoryOnboardingSkill };
