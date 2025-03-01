export interface AmqpTransportOptions {
  url: string;
  queue: string;
  exchange: string;
  exchangeType: ExchangeType;
  bindingKeys: string[];
  avoidNoHandlerError?: boolean;
  autoCreate?: boolean;
}

export enum ExchangeType {
  TOPIC = 'topic',
  FANOUT = 'fanout',
  DIRECT = 'direct',
}
