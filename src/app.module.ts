import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserMongoRepository } from './infrastructure/persistence/user.mongo.repository';
import { UserController } from './interfaces/rest/user.controller';
import { UserCreationService } from './application/services/user-creation.service';
import { UserSchema } from './infrastructure/schemas/user.schema';
import { EmailService } from './application/services/email.service';
import { RabbitMQService } from './application/services/rabbitmq.service';
import { SenderFactory } from './application/services/sender.factory';
import { FakeEmailService } from './application/services/fake/fake-email.service';
import { FakeRabbitMQPService } from './application/services/fake/fake-rabbitmq.service';
import { EnvironmentTypes } from './domain/enums/environment-types';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI as string, {
      autoIndex: true,
    }),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
  ],
  controllers: [UserController],
  providers: [
    UserCreationService,
    {
      provide: 'EmailService',
      useFactory: (configService: ConfigService) => {
        const isTestEnv =
          configService.get<EnvironmentTypes>('NODE_ENV') ===
          EnvironmentTypes.Prod;
        return isTestEnv
          ? new EmailService(configService)
          : new FakeEmailService();
      },
      inject: [ConfigService],
    },
    {
      provide: 'RabbitMQService',
      useFactory: (configService: ConfigService) => {
        const isTestEnv =
          configService.get<EnvironmentTypes>('NODE_ENV') ===
          EnvironmentTypes.Prod;
        return isTestEnv
          ? new RabbitMQService(configService)
          : new FakeRabbitMQPService();
      },
      inject: [ConfigService],
    },
    SenderFactory,
    { provide: 'UserRepository', useClass: UserMongoRepository },
  ],
})
export class AppModule {}
