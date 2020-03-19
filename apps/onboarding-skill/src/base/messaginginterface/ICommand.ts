interface ICommand {
  fn: () => void;
}

class Command {
  constructor(public fnName: string, public args: IArguments) {}
}
export { ICommand, Command };
