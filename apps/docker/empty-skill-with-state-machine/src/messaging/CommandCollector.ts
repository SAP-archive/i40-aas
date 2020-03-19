import { ICommand } from "../services/onboarding/messaginginterface/ICommand";

class CommandCollector {
  private commands: ICommand[] = [];

  add(command: ICommand) {
    this.commands.push(command);
  }

  pop() {
    return this.commands.shift();
  }
}
export { CommandCollector };
