import { Injectable } from '@nestjs/common';
import {
  ISender,
  ISenderFactory,
} from '../../domain/interfaces/sender.interface';
import { EmailService } from './email.service';
import { RabbitMQService } from './rabbitmq.service';
import { SenderTypes } from 'src/domain/enums/sender-types';
import { EnvironmentTypes } from 'src/domain/enums/environment-types';
import { FakeEmailService } from './fake/fake-email.service';
import { FakeRabbitMQPService } from './fake/fake-rabbitmq.service';

@Injectable()
export class SenderFactory implements ISenderFactory {
  constructor(
    private readonly emailService: EmailService,
    private readonly rabbitMQService: RabbitMQService,
    private readonly fakeEmailService: FakeEmailService,
    private readonly fakeRabbitMQService: FakeRabbitMQPService,
  ) {}

  getSender(env: EnvironmentTypes, type: SenderTypes): ISender {
    const senderTypeError = new Error(
      `Invalid sender type ${type} in ${env} environment`,
    );
    if (env === EnvironmentTypes.Dev) {
      switch (type) {
        case SenderTypes.Email:
          return this.fakeEmailService;
        case SenderTypes.RabbitMQ:
          return this.fakeRabbitMQService;
        default:
          throw senderTypeError;
      }
    } else if (env == EnvironmentTypes.Prod) {
      switch (type) {
        case SenderTypes.Email:
          return this.emailService;
        case SenderTypes.RabbitMQ:
          return this.rabbitMQService;
        default:
          throw senderTypeError;
      }
    }
    throw new Error(`Invalid environment ${env}`);
  }
}
