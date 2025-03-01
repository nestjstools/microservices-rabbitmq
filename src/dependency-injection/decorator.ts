import { EventPattern } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';

export const MessageHandler = (routingKey: string) => {
  return function (target: any) {
    if (!target.prototype.handle) {
      throw new Error(`Class ${target.name} must implement a IMessageHandler interface.`);
    }

    Reflect.decorate([EventPattern(routingKey)], target.prototype, 'handle', Object.getOwnPropertyDescriptor(target.prototype, 'handle'));
  };
}

export const MessageBus = (name: string) => Inject(name);
