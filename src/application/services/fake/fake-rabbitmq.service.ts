import { Injectable } from '@nestjs/common';
import { ISender } from 'src/domain/interfaces/sender.interface';

@Injectable()
export class FakeRabbitMQPService implements ISender {
  async send(message: string) {
    console.log(`RabbitMQ message published: ${message}`);
  }
}
