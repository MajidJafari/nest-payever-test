import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository';
import { randomBytes, pbkdf2Sync } from 'crypto';
import { IUser } from '../../domain/interfaces/user.interface';
import { SenderTypes } from '../../domain/enums/sender-types';
import { SenderFactory } from './sender.factory';
import { ConfigService } from '@nestjs/config';
import { EnvironmentTypes } from '../../domain/enums/environment-types';

@Injectable()
export class UserCreationService {
  constructor(
    @(Inject('UserRepository') as any)
    private readonly userRepository: IUserRepository,
    private readonly senderFactory: SenderFactory,
    private readonly configService: ConfigService,
  ) {}

  private hashPassword(password: string): { salt: string; hash: string } {
    const salt = randomBytes(16).toString('hex');
    const hash = pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString(
      'hex',
    );
    return { salt, hash };
  }

  async createUser(
    name: string,
    email: string,
    password: string,
  ): Promise<IUser> {
    const { salt, hash } = this.hashPassword(password);

    const savedUser = await this.userRepository.save({
      name,
      email,
      password: {
        hash,
        salt,
      },
    });

    const env = this.configService.get<EnvironmentTypes>('NODE_ENV');

    const emailSender = this.senderFactory.getSender(env, SenderTypes.Email);
    await emailSender.send('Welcome to the platform!', email);

    const rabbitMQSender = this.senderFactory.getSender(
      env,
      SenderTypes.RabbitMQ,
    );
    await rabbitMQSender.send('User created successfully', email);

    return savedUser;
  }
}
