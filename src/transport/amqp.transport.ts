import { CustomTransportStrategy, Server } from '@nestjs/microservices';
import { Injectable } from '@nestjs/common';
import { AsyncMessage, Connection } from 'rabbitmq-client';
import { AmqpTransportOptions, ExchangeType } from './amqp.transport-options';
import { RoutingKeyHeader } from '../const';

@Injectable()
export class AmqpTransport extends Server implements CustomTransportStrategy {
  private client: Connection;

  constructor(private options: AmqpTransportOptions) {
    super();
    this.options.avoidNoHandlerError = options.avoidNoHandlerError ?? false;
    this.client = new Connection(this.options.url);
  }

  on<EventKey, EventCallback>(event: EventKey, callback: EventCallback): any {
    throw new Error('Unimplemented');
  }

  unwrap<T>(): T {
    throw new Error('Unimplemented');
  }

  async listen(callback: () => void) {
    await this.initialize();

    this.client.createConsumer({ queue: this.options.queue, queueOptions: { durable: true } }, async (msg: AsyncMessage) => {
      let message = msg.body;
      if (Buffer.isBuffer(message)) {
        message = JSON.parse(msg.body);
      }

      const headers = msg.headers as { [k: string]: string };
      const routingKey: string = headers[RoutingKeyHeader] ?? msg.routingKey;
      const handler = this.messageHandlers.get(routingKey);

      if (this.options.avoidNoHandlerError || handler === undefined) {
        this.logger.error(`Handler for routingKey ${msg.routingKey} does not exist`);
        return;
      }

      handler(message);
    });

    callback();
  }

  async close() {
    await this.client.close();
  }

  private async initialize(): Promise<void> {
    if (!this.options.autoCreate) {
      return Promise.resolve();
    }

    await this.client.exchangeDeclare({ durable: true, exchange: this.options.exchange, type: this.options.exchangeType });
    await this.client.queueDeclare({ queue: this.options.queue, durable: true });

    for(const bindingKey of this.options.bindingKeys) {
      await this.client.queueBind({ routingKey: bindingKey, queue: this.options.queue, exchange: this.options.exchange });
    }

    return Promise.resolve();
  }
}
