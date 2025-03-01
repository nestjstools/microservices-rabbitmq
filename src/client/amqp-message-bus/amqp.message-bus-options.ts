export interface AmqpMessageBusOptions {
  name: string;
  url: string;
  exchange: string;
  routingKey?: string;
}
