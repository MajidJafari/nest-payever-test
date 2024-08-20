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
import { AvatarService } from '../../src/application/services/avatar.service';
import { AvatarSchema } from '../../src/infrastructure/schemas/avatar.schema';
import { AvatarMongoRepository } from '../../src/infrastructure/persistence/avatar.mongo.repository';
import { UserService } from '../../src/application/services/user.service';
import * as fs from 'fs';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let userRepo: UserMongoRepository;
  let avatarService: AvatarService;
  let avatarRepo: AvatarMongoRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot('mongodb://localhost:27017/payerver-test-db'),
        MongooseModule.forFeature([
          { name: 'User', schema: UserSchema },
          { name: 'Avatar', schema: AvatarSchema },
        ]),
      ],
      controllers: [UserController],
      providers: [
        UserCreationService,
        UserService,
        AvatarService,
        { provide: 'EmailService', useClass: FakeEmailService },
        { provide: 'RabbitMQService', useClass: FakeRabbitMQPService },
        SenderFactory,
        { provide: 'UserRepository', useClass: UserMongoRepository },
        { provide: 'AvatarRepository', useClass: AvatarMongoRepository },
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

    avatarService = moduleFixture.get<AvatarService>(AvatarService);
    userRepo = moduleFixture.get<UserMongoRepository>('UserRepository');
    avatarRepo = moduleFixture.get<AvatarMongoRepository>('AvatarRepository');
  });

  describe('createUser /api/users (POST) ', () => {
    afterEach(async () => {
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
    it('should response with 404 if data can not be retrieved from https://reqres.in', async () => {
      await request(app.getHttpServer()).get('/users/13').expect(404);
    });
  });

  describe('getUserAvatar', () => {
    const userId = '1';
    let filePath: string;

    beforeEach(() => {
      filePath = avatarService.getFilePath(userId);
    });

    afterAll(async () => {
      await fs.unlinkSync(filePath);
    });

    it('should create an entry in DB with userId and hash and store the file', async () => {
      await request(app.getHttpServer())
        .get(`/users/${userId}/avatar`)
        .expect(200)
        .expect(({ body }: any) => {
          expect(body.data).toHaveProperty('base64Avatar');
        });
      expect(fs.existsSync(filePath)).toBe(true);

      const avatar = await avatarRepo.findByUserId(userId);
      expect(avatar).toHaveProperty('hash');
    });

    describe('Avatar Entry Exist in DB', () => {
      let verifyHashSpy: jest.SpyInstance;
      let storeAvatarSpy: jest.SpyInstance;

      beforeEach(async () => {
        filePath = avatarService.getFilePath(userId);

        await request(app.getHttpServer())
          .get(`/users/${userId}/avatar`)
          .expect(200);

        verifyHashSpy = jest.spyOn(avatarService, 'verifyHash');
        storeAvatarSpy = jest.spyOn(avatarService, 'storeAvatar');
      });

      it('should read file from storage and if hash is verified returns it in base64 format if avatar for user already exist', async () => {
        const avatar = await avatarRepo.findByUserId(userId);
        expect(avatar).toHaveProperty('hash');

        await request(app.getHttpServer())
          .get(`/users/${userId}/avatar`)
          .expect(200)
          .expect(({ body }: any) => {
            expect(body.data).toHaveProperty('base64Avatar');
          });
        expect(storeAvatarSpy).not.toHaveBeenCalled();
        expect(verifyHashSpy).toHaveBeenCalledWith(filePath, avatar.hash);
      });

      it('should store file into storage and if hash is verified returns it in base64 format if avatar for user already exist but for some reason file has been deleted', async () => {
        const avatar = await avatarRepo.findByUserId(userId);
        expect(avatar).toHaveProperty('hash');
        fs.unlinkSync(filePath);

        await request(app.getHttpServer())
          .get(`/users/${userId}/avatar`)
          .expect(200)
          .expect(({ error, body }: any) => {
            console.log(error);
            expect(body.data).toHaveProperty('base64Avatar');
          });
        expect(storeAvatarSpy).toHaveBeenCalledTimes(1);
        expect(verifyHashSpy).toHaveBeenCalledWith(filePath, avatar.hash);
      });
    });
  });

  afterAll(async () => {
    await app.close();
    jest.resetAllMocks();
  });
});
