export interface IMessageHandler<T> {
  handle(message: T): Promise<void>;
}
