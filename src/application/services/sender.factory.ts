import { Inject, Injectable } from '@nestjs/common';
import {
  ISender,
  ISenderFactory,
} from '../../domain/interfaces/sender.interface';
import { EmailService } from './email.service';
import { RabbitMQService } from './rabbitmq.service';
import { SenderTypes } from '../../domain/enums/sender-types';

@Injectable()
export class SenderFactory implements ISenderFactory {
  constructor(
    @Inject('EmailService')
    private readonly emailService: EmailService,
    @Inject('RabbitMQService')
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  getSender(type: SenderTypes): ISender {
    switch (type) {
      case SenderTypes.Email:
        return this.emailService;
      case SenderTypes.RabbitMQ:
        return this.rabbitMQService;
      default:
        throw new Error(`Invalid sender type ${type}`);
    }
  }
}
