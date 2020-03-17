import { ICommand, Command } from '../messaginginterface/ICommand';

class CommandCollector {
  private commands: ICommand[] = [];
  private xcommands: Command[] = [];

  add(command: ICommand) {
    this.commands.push(command);
  }

  pop() {
    return this.commands.shift();
  }

  addXCommand(xcommand: Command) {
    this.xcommands.push(xcommand);
  }

  popXCommand() {
    return this.xcommands.shift();
  }
}
export { CommandCollector };
