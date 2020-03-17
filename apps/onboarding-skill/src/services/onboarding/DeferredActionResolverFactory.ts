import { CommandCollector } from '../../base/messaging/CommandCollector';
import { ICommand } from '../../base/messaginginterface/ICommand';
import { logger } from '../../log';
import { Utils } from '../../base/Utils';

class DeferredActionResolverFactory {
  static getInstance(actionResolver: any): any {
    var retVal: any = {};
    retVal.commandCollector = new CommandCollector();
    var x: string[] = Utils.getMethods(actionResolver);
    x.forEach(methodName => {
      retVal[methodName] = (...args: any) => {
        retVal.commandCollector.add({
          fn: () => {
            logger.debug(
              'Calling ' + methodName + ' with args: ' + JSON.stringify(args)
            );
            actionResolver[methodName].apply(actionResolver, args);
          }
        });
      };
    });
    retVal.interpret = function(command: ICommand) {
      command.fn();
    };

    retVal.commit = function() {
      let c: ICommand | undefined;
      while ((c = retVal.commandCollector.pop()) !== undefined) {
        retVal.interpret(c);
      }
    };
    return retVal;
  }
}
export { DeferredActionResolverFactory };
