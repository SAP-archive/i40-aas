import { CommandCollector } from '../../base/messaging/CommandCollector';
import { ICommand } from '../../base/messaginginterface/ICommand';

class DeferredActionResolverFactory {
  private static getMethods(obj: any): string[] {
    var x: string[] = Object.getOwnPropertyNames(obj).filter(
      item => typeof obj[item] === 'function'
    );
    return x;
  }

  static getDeferredExecutor(actionResolver: any): any {
    var retVal: any = {};
    retVal.commandCollector = new CommandCollector();
    var x: string[] = DeferredActionResolverFactory.getMethods(actionResolver);
    x.forEach(methodName => {
      retVal[methodName] = () =>
        retVal.commandCollector.add({
          fn: () => actionResolver[methodName].apply(arguments)
        });
    });
    retVal.interpret = function(command: ICommand) {
      command.fn();
    };

    retVal.commit = function() {
      let c: ICommand | undefined;
      while ((c = this.commandCollector.pop()) !== undefined) {
        this.interpret(c);
      }
    };
    return retVal;
  }
}
export { DeferredActionResolverFactory };
