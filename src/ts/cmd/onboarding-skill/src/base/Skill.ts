import { interpret, State, Interpreter, EventObject } from 'xstate';

import { IDatabaseClient } from './persistenceinterface/IDatabaseClient';
import { IStateRecord } from './persistenceinterface/IStateRecord';
import { MySkillStateMachineSpecification } from '../services/onboarding/MySkillStateMachineSpecification';
import * as _ from 'lodash';
import { InteractionMessage } from 'i40-aas-objects';
import { ISkillContext } from './statemachineinterface/ISkillContext';
import { MessageDispatcherDeferredWrapper } from './MessageDispatcherDeferredWrapper';
import { IInitializer } from './statemachineinterface/IInitializer';

const logger = require('aas-logger/lib/log');

//Try to keep this generic. Do not mention roles or message types. Do not perform actions that
//should be modelled in the state machine. This class should remain relatively constant. It
//could be any skill
class Skill {
  private readonly stateMachineSpecification: MySkillStateMachineSpecification = new MySkillStateMachineSpecification();

  constructor(
    //private messageDispatcher: IAasMessageDispatcher,
    //TODO: Interface?
    private initializer: IInitializer,
    private dbClient: IDatabaseClient
  ) {}

  receivedUnintelligibleMessage(message: InteractionMessage): void {
    //TODO:without getter, ask initializer to do it
    this.initializer.getPlainAasMessageDispatcher().replyNotUnderstood(message);
  }

  preprocessingError(message: InteractionMessage): void {
    this.initializer.getPlainAasMessageDispatcher().replyError(message);
  }

  private async getPreviousStateFromDb(
    conversationId: string
  ): Promise<IStateRecord | null> {
    await this.dbClient.connect();
    let stateRecord: IStateRecord | null = await this.dbClient.getOneByKey({
      _id: conversationId,
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
    if ((error.message as string).includes('does not accept event'))
      return true;
    else return false;
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
    let deferredMessageDispatcher = MessageDispatcherDeferredWrapper.wrap(
      this.initializer.getPlainAasMessageDispatcher()
    );
    let context = this.initializer.createContextForStateMachine(
      message,
      deferredMessageDispatcher
    );

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
            'This interaction refers to a previously closed conversation.'
          );
          this.initializer
            .getPlainAasMessageDispatcher()
            .replyNotUnderstood(message);
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
      //this needs to be set for each and every event
      onboardingService.onTransition(async (state) => {
        logger.debug('Transitioned to ' + JSON.stringify(state.value));
        if (!state.changed) return;
        //TODO: database will be written to if the state was loaded
        //but happens to be a final state, i.e. is the same as in
        //the db. No need to write it then.
        try {
          let stateClone = this.removeNonPersistentPartsOfState(state);
          const result = await this.dbClient.update(
            {
              _id: conversationId,
              version: versionCounter++,
            }, //find by
            {
              //update these
              serializedState: JSON.stringify(stateClone),
            },
            true //increment version
          );
          logger.debug('db updated:' + JSON.stringify(result));
          deferredMessageDispatcher.commit();
          if (fnOnTransitionDone) fnOnTransitionDone(state);
        } catch (error) {
          logger.error(
            'The database cannot be written to. More specific:' + error.message
          );

          //only respond to external trigger (once)
          if (state.event.type === event)
            this.initializer.getPlainAasMessageDispatcher().replyError(message);
          if (fnOnTransitionError) fnOnTransitionError(state);
        }
      });

      onboardingService.send(event);
    } catch (error) {
      logger.error('The transition could not take place. ' + error.message);
      if (!context.message) {
        logger.error(
          'Asset repository skill cannot is missing in its context the message to reply to with an error!'
        );
      } else if (Skill.isInvalidTransition(error)) {
        this.initializer
          .getPlainAasMessageDispatcher()
          .replyNotUnderstood(context.message);
      } else {
        //TODO: a valid transition cannot take place. The state machine is probably now useless.
        //Need to move it into a failed state, or handle otherwise.
        logger.error('SEVERE: A valid transition could not take place.');
        this.initializer
          .getPlainAasMessageDispatcher()
          .replyError(context.message);
      }
    }
  }
}

export { Skill };
