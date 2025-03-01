<p align="center">
    <image src="nestjstools-logo.png" width="400">
</p>

# @nestjstools/microservices-rabbitmq

`@nestjstools/microservices-rabbitmq` is a powerful and flexible transport layer for NestJS microservices, enabling seamless communication with RabbitMQ. It extends the default RabbitMQ transport options by supporting multiple exchange types like direct, topic, and fanout—making it easier to build scalable and maintainable microservice architectures.

This library ensures clean message payloads without any special formatting, simplifying the integration between different systems. With its flexible message handling capabilities, you can define handlers either at the class level or method level based on your architecture needs.

Integration is built on top of `rabbitmq-client` lib

## Installation

```bash
npm install @nestjstools/microservices-rabbitmq @nestjs/microservices
```

or

```bash
yarn add @nestjstools/microservices-rabbitmq @nestjs/microservices
```
## Setup your microservice

---

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions } from '@nestjs/microservices';
import { AmqpTransport, ExchangeType } from '@nestjstools/microservices-rabbitmq';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    strategy: new AmqpTransport({
      url: 'amqp://guest:guest@localhost:5672',
      autoCreate: true,
      bindingKeys: ['my_app.event'],
      queue: 'my_app.event',
      exchange: 'my_app.exchange',
      exchangeType: ExchangeType.TOPIC, // Direct, Fanout, Topic are available
    }),
  });

  await app.listen();
}
bootstrap();
```

---

### Key Features:

* **Supports multiple exchange types:** Extends beyond the default RabbitMQ transport to include exchanges like `topic`, `direct` and `fanout`.
* **Clean message payloads:** Messages do not require any special formatting, ensuring simplicity and efficiency.
* **Seamless integration:** Easily integrates with other systems that use different exchange types, such as `topic`, `direct` and `fanout`.
* **Flexible message handling:** Supports two methods for handling messages — at the class level or method level.
* **Compatible with NestJS microservices:** Operates as a standard transport layer for `@nestjs/microservices`.

---

## Handle messages

### Class handler
If you would like handle your messages from rabbitmq on `class` level 

```typescript
import { AppService } from './app.service';
import { IMessageHandler, MessageHandler } from '@nestjstools/microservices-rabbitmq';
import { UserCreated } from './user-created';

@MessageHandler('my_app.event.user_created') //map your routingKey or messageRoute
export class UserCreatedHandler implements IMessageHandler<UserCreated> {
  constructor(private readonly appService: AppService) {}

  async handle(message: UserCreated): Promise<void> {
    //TODO Write your own logic
    this.appService.print(message);
  }
}
```

### Method handler
If you would like handle your messages from rabbitmq on `method` level 

```typescript
import { AppService } from './app.service';
import { UserCreated } from './user-created';
import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';

@Controller()
export class UserCreatedMethodHandler {
  constructor(private readonly appService: AppService) {}

  @EventPattern('my_app.event.user_created') //This is standard handler from @nestjs/microservices
  async fromMethodLevel(message: UserCreated): Promise<void> {
    //TODO Write your own logic
    this.appService.print(message);
  }
}
```

---

## How to Dispatch Messages to RabbitMQ

This guide demonstrates how to configure message buses and dispatch messages to RabbitMQ using `AmqpMessageBusModule`.

---

### Defining Message Buses

To send messages, you first need to define one or more message buses in your module configuration.

**Example Configuration:**
```typescript
@Module({
  imports: [
    AmqpMessageBusModule.forRoot([
      {
        name: 'event.bus', // Name of your message bus
        url: 'amqp://guest:guest@localhost:5672', // Connection URL for RabbitMQ
        exchange: 'my_app.exchange', // Exchange name for message delivery
      }
      // You can define multiple buses to send messages to different exchanges
    ])
  ],
  controllers: [UserCreatedHandler, UserCreatedMethodHandler],
  providers: [AppService],
})
export class AppModule {}
```

- **`name`**: Identifies the bus to use when dispatching messages.
- **`url`**: Specifies the connection URL for RabbitMQ.
- **`exchange`**: Determines the exchange to which messages will be sent.
- **`routingKey`**: Optional, but mandatory if exchange is Direct
- You can configure **multiple buses** if needed.

---

### Dispatching Messages

Once the bus is configured, you can dispatch messages by injecting the bus and using the `dispatch` method.

**Example:**
```typescript
export class ExampleService {
  // Inject the message bus using @MessageBus decorator
  constructor(@MessageBus('event.bus') private readonly eventBus: AmqpMessageBus) {}

  send(): any {
    this.eventBus.dispatch(
      new RoutingMessage(
        new UserCreated('uuid', 'email@email.com'),
        'my_app.event.user_created' // Routing key
      )
    );
  }
}
```

- Use `@MessageBus('event.bus')` to inject the correct bus based on the name defined earlier.
- The `dispatch` method sends a message to the specified exchange with a routing key.
- The message is constructed using `RoutingMessage` with the payload (`UserCreated` in this case) and a **routing key**.

---

## Message Binding Strategies in RabbitMQ
Efficient message routing is essential in distributed systems. This guide covers two common strategies for binding messages in RabbitMQ: `Topic`, `Fanout` and `Direct` Exchange.

### Topic Exchange
The Topic Exchange allows you to route messages based on pattern matching of the routing key. Handlers are mapped using the RoutingKey, making it straightforward to bind messages correctly.
```typescript
AmqpMessageBusModule.forRoot([
  {
    name: 'event.bus',
    url: 'amqp://guest:guest@localhost:5672',
    exchange: 'my_app.exchange',
  }
])
```
* Uses pattern-based routing.

### Direct Exchange
The Direct Exchange delivers messages to queues based on an exact match between the message’s routing key and the binding key.
```typescript
AmqpMessageBusModule.forRoot([
  {
    name: 'event.bus',
    url: 'amqp://guest:guest@localhost:5672',
    exchange: 'my_app.exchange',
    routingKey: 'my_routing_key_to_queue_via_direct_exchange',
  }
])
```
* Messages must include a header: `x-routing-key: your_message_routing_on_handler`.
* If using the built-in `AmqpMessageBus`, you can set the routingKey directly in the config.
* Best for cases requiring exact routing key matches.

### Fanout Exchange
The Fanout Exchange broadcasts messages to all bound queues, ignoring the routing key. This type of exchange is useful for scenarios where you need to distribute the same message to multiple consumers.
```typescript
AmqpMessageBusModule.forRoot([
  {
    name: 'event.bus',
    url: 'amqp://guest:guest@localhost:5672',
    exchange: 'my_app.exchange',
  }
])
```
* No need for a routing key — messages are sent to all queues bound to the exchange.
* Useful for pub/sub patterns, where every subscriber should receive a copy of each message.
* Simplifies configuration but may lead to higher message volume.
