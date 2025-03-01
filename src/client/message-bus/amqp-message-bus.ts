import { Connection, Publisher } from 'rabbitmq-client';
import { RoutingMessage } from './routing-message';
import { RmqRecordBuilder } from '@nestjs/microservices';
import { RoutingKeyHeader } from '../../const';

export class AmqpMessageBus {
  private readonly messagePublisher: Publisher;

  constructor(
    private readonly exchange,
    private readonly connection: Connection,
    private readonly routingKey?: string,
  ) {
    this.messagePublisher = this.connection.createPublisher();
  }

  dispatch(message: RoutingMessage): void {
    const rabbitMqMessage = new RmqRecordBuilder(message.message)
      .setOptions({
        headers: {
          [RoutingKeyHeader]: message.routingKey,
          ...message.headers,
        },
      })
      .build();

    this.messagePublisher.send(
      {exchange: message.exchange ?? this.exchange, routingKey: this.routingKey ?? message.routingKey, headers: rabbitMqMessage.options?.headers},
      rabbitMqMessage.data,
    );
  }
}
