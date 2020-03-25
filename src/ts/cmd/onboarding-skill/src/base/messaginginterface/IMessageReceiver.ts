
interface IMessageReceiver {
  //TODO: localization of string when converting from bytes
  receive: (msg: string) => void;
}

export { IMessageReceiver };
