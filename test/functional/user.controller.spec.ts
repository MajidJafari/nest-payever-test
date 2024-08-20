import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { UserController } from '../../src/interfaces/rest/user.controller';
import { UserCreationService } from '../../src/application/services/user-creation.service';
import { CustomValidationPipe } from '../../src/interfaces/pipes/custom-validation.pipe';
import { WrapResponseInterceptor } from '../../src/interfaces/interceptors/wrap-response.interceptor';
import { CustomExceptionFilter } from '../../src/interfaces/filters/custom-exception.filter';
import { MongooseModule } from '@nestjs/mongoose';
import { UserMongoRepository } from '../../src/infrastructure/persistence/user.mongo.repository';
import { SenderFactory } from '../../src/application/services/sender.factory';
import { FakeEmailService } from '../../src/application/services/fake/fake-email.service';
import { FakeRabbitMQPService } from '../../src/application/services/fake/fake-rabbitmq.service';
import { UserSchema } from '../../src/infrastructure/schemas/user.schema';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let userRepo: UserMongoRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot('mongodb://localhost:27017/payerver-test-db'),
        MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
      ],
      controllers: [UserController],
      providers: [
        UserCreationService,
        { provide: 'EmailService', useClass: FakeEmailService },
        { provide: 'RabbitMQService', useClass: FakeRabbitMQPService },
        SenderFactory,
        { provide: 'UserRepository', useClass: UserMongoRepository },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app
      .useGlobalPipes(
        new CustomValidationPipe({
          transform: true,
          whitelist: true,
          forbidNonWhitelisted: true,
        }),
      )
      .useGlobalInterceptors(new WrapResponseInterceptor())
      .useGlobalFilters(new CustomExceptionFilter());
    await app.init();

    userRepo = moduleFixture.get<UserMongoRepository>('UserRepository');
  });

  describe('createUser /api/users (POST) ', () => {
    beforeEach(async () => {
      await userRepo.removeAll();
    });
    it('should create user and return 201 status', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password',
        })
        .expect(201)
        .expect(({ body }: any) => {
          expect(body).not.toHaveProperty('password');
          expect(body.data.name).toEqual('John Doe');
          expect(body.data.email).toEqual('john@example.com');
        });
    });

    it('should not create user with the already existed email', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password',
        })
        .expect(201);
      await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password',
        })
        .expect(409);
    });

    describe('validation', () => {
      it('should not allow user creation if name is not entered', async () => {
        await request(app.getHttpServer())
          .post('/users')
          .send({
            email: 'john@example.com',
            password: 'password',
          })
          .expect(422);
      });
      it('should not allow user creation if email is not entered', async () => {
        await request(app.getHttpServer())
          .post('/users')
          .send({
            name: 'John Doe',
            password: 'password',
          })
          .expect(422);
      });
      it('should not allow user creation if name is not string', async () => {
        await request(app.getHttpServer())
          .post('/users')
          .send({
            name: ['John Doe'],
            email: 'john@example.com',
            password: 'password',
          })
          .expect(422);
      });
      it('should not allow user creation if email is not in email format', async () => {
        await request(app.getHttpServer())
          .post('/users')
          .send({
            name: 'John Doe',
            email: 'john',
            password: 'password',
          })
          .expect(422);
      });
    });

    describe('Sanitization', () => {
      it('created user should have trimmed name', async () => {
        await request(app.getHttpServer())
          .post('/users')
          .send({
            name: 'John Doe  ',
            email: 'john@example.com',
            password: 'password',
          })
          .expect(201)
          .expect(({ body }: any) => {
            expect(body.data.name).toEqual('John Doe');
          });
      });
      it('created user should have its email in trimmed lowercase format', async () => {
        await request(app.getHttpServer())
          .post('/users')
          .send({
            name: 'John Doe  ',
            email: ' JOHN@EXamplE.cOm  ',
            password: 'password',
          })
          .expect(201)
          .expect(({ body }: any) => {
            expect(body.data.email).toEqual('john@example.com');
          });
      });
    });
  });

  describe('getUser', () => {
    it('should fetch user from https://reqres.in', async () => {
      await request(app.getHttpServer())
        .get('/users/1')
        .expect(200)
        .expect(({ body }: any) => {
          expect(body.data.id).toEqual(1);
          expect(body.data.email).toEqual('george.bluth@reqres.in');
          expect(body.data).toHaveProperty('avatar');
        });
    });
    it('should return null if not data can be retrieved from https://reqres.in', async () => {
      await request(app.getHttpServer())
        .get('/users/13')
        .expect(200)
        .expect(({ body }: any) => {
          expect(body.data).toBeNull();
        });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
