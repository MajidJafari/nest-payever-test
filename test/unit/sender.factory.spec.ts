import { Test, TestingModule } from '@nestjs/testing';
import { SenderFactory } from '../../src/application/services/sender.factory';
import { ISender } from '../../src/domain/interfaces/sender.interface';
import { SenderTypes } from '../../src/domain/enums/sender-types';

describe('SenderFactory', () => {
  let factory: SenderFactory;
  let emailServiceMock: ISender & { name: string };
  let rabbitMQServiceMock: ISender & { name: string };

  beforeEach(async () => {
    emailServiceMock = {
      name: 'emailSender',
      send: jest.fn(),
    };

    rabbitMQServiceMock = {
      name: 'rabbitMQSender',
      send: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SenderFactory,
        { provide: 'EmailService', useValue: emailServiceMock },
        { provide: 'RabbitMQService', useValue: rabbitMQServiceMock },
      ],
    }).compile();

    factory = module.get<SenderFactory>(SenderFactory);
  });

  it('should return email sender', () => {
    const sender: any = factory.getSender(SenderTypes.Email);
    expect(sender.name).toBe('emailSender');
  });

  it('should return rabbitmq sender', () => {
    const sender: any = factory.getSender(SenderTypes.RabbitMQ);
    expect(sender.name).toBe('rabbitMQSender');
  });
});
