import { CommandCollector } from './messaging/CommandCollector';
import { ICommand } from './messaginginterface/ICommand';
import { Utils } from './Utils';

const logger = require('aas-logger/lib/log');

class MessageDispatcherDeferredWrapper {
  static wrap(messageDispatcher: any): any {
    var retVal: any = {};
    retVal.commandCollector = new CommandCollector();
    var x: string[] = Utils.getMethods(messageDispatcher);
    x.forEach((methodName) => {
      retVal[methodName] = (...args: any) => {
        retVal.commandCollector.add({
          fn: () => {
            logger.debug(
              'Calling ' + methodName + ' with args: ' + JSON.stringify(args)
            );
            messageDispatcher[methodName].apply(messageDispatcher, args);
          },
        });
      };
    });
    retVal.interpret = function (command: ICommand) {
      command.fn();
    };

    retVal.commit = function () {
      let c: ICommand | undefined;
      while ((c = retVal.commandCollector.pop()) !== undefined) {
        retVal.interpret(c);
      }
    };
    return retVal;
  }
}
export { MessageDispatcherDeferredWrapper };
