import { Test, TestingModule } from '@nestjs/testing';
import { UserCreationService } from '../../src/application/services/user-creation.service';
import { IUserRepository } from '../../src/domain/repositories/user.repository';
import { SenderFactory } from '../../src/application/services/sender.factory';
import { ISenderFactory } from '../../src/domain/interfaces/sender.interface';
import { SenderTypes } from '../../src/domain/enums/sender-types';

describe('UserCreationService', () => {
  let service: UserCreationService;
  let userRepositoryMock: IUserRepository;
  let senderFactoryMock: ISenderFactory;

  beforeEach(async () => {
    userRepositoryMock = {
      save: jest.fn(),
    };

    const emailSenderMock = { send: jest.fn() };
    const rabbitMQSenderMock = { send: jest.fn() };

    senderFactoryMock = {
      getSender: jest.fn().mockImplementation((type) => {
        return type === 'email' ? emailSenderMock : rabbitMQSenderMock;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserCreationService,
        { provide: 'UserRepository', useValue: userRepositoryMock },
        { provide: SenderFactory, useValue: senderFactoryMock },
      ],
    }).compile();

    service = module.get<UserCreationService>(UserCreationService);
  });

  it('should hash the password and save the user', async () => {
    const mockUser = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password',
    };
    userRepositoryMock.save = jest.fn().mockResolvedValue(mockUser);

    const result = await service.createUser(
      'John Doe',
      'john@example.com',
      'password',
    );

    expect(userRepositoryMock.save).toHaveBeenCalled();
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john@example.com');
  });

  it('should call email and rabbitMQ senders', async () => {
    await service.createUser('John Doe', 'john@example.com', 'password');

    expect(
      senderFactoryMock.getSender!(SenderTypes.Email).send,
    ).toHaveBeenCalledWith('Welcome to the platform!', 'john@example.com');
    expect(
      senderFactoryMock.getSender!(SenderTypes.RabbitMQ).send,
    ).toHaveBeenCalledWith('User created successfully', 'john@example.com');
  });
});
