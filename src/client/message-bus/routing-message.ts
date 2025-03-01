export class RoutingMessage {

  constructor(
    public readonly message: object,
    public readonly routingKey: string,
    public readonly exchange?: string,
    public readonly headers?: { [key: string]: string },
  ) {
  }
}
