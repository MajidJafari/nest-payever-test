import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { ISender } from '../../domain/interfaces/sender.interface';
import { EnvironmentTypes } from 'src/domain/enums/environment-types';

@Injectable()
export class RabbitMQService implements ISender {
  private connection!: amqp.Connection;
  private channel!: amqp.Channel;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const env = this.configService.get<EnvironmentTypes>('NODE_ENV');
    if (env === EnvironmentTypes.Prod) {
      await this.connectToRabbitMQ();
    }
  }

  async onModuleDestroy() {
    const env = this.configService.get<EnvironmentTypes>('NODE_ENV');
    if (env === EnvironmentTypes.Prod) {
      await this.closeConnection();
    }
  }

  private async connectToRabbitMQ() {
    try {
      const hostname = this.configService.get<string>('RABBITMQ_HOST');
      const port = this.configService.get<number>('RABBITMQ_PORT');
      const username = this.configService.get<string>('RABBITMQ_USER');
      const password = this.configService.get<string>('RABBITMQ_PASS');

      this.connection = await amqp.connect({
        hostname,
        port,
        username,
        password,
      });
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue('user_created_queue', { durable: true });
    } catch (error) {
      console.error('Failed to connect to RabbitMQ', error);
      throw new Error('Failed to connect to RabbitMQ');
    }
  }

  async send(message: string, recipient: string) {
    const payload = JSON.stringify({ message, recipient });
    this.channel.sendToQueue('user_created_queue', Buffer.from(payload), {
      persistent: true,
    });
    console.log('Published event to RabbitMQ:', payload);
  }

  private async closeConnection() {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }
}
