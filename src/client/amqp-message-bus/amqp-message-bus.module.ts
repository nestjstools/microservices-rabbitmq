import { DynamicModule, Module, Provider } from '@nestjs/common';
import { AmqpMessageBusOptions } from './amqp.message-bus-options';
import { AmqpMessageBus } from '../message-bus/amqp-message-bus';
import { Connection } from 'rabbitmq-client';

@Module({})
export class AmqpMessageBusModule {
  static forRoot(options: AmqpMessageBusOptions[], isGlobal = true): DynamicModule {
    const defineBuses = () => {
      const result: Provider[] = [];

      for(const option of options) {
        result.push({
          provide: option.name,
          useFactory: () => {
            return new AmqpMessageBus(option.exchange, new Connection(option.url), option.routingKey);
          },
        });
      }

      return result;
    };

    return {
      global: isGlobal,
      module: AmqpMessageBusModule,
      providers: [
        ...defineBuses(),
      ],
      exports: [
        ...options.map(o => o.name),
      ],
    }
  }
}
