import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { UserController } from '../../src/interfaces/rest/user.controller';
import { UserCreationService } from '../../src/application/services/user-creation.service';
import { CustomValidationPipe } from '../../src/interfaces/pipes/custom-validation.pipe';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let userCreationServiceMock: Partial<UserCreationService>;

  beforeEach(async () => {
    userCreationServiceMock = {
      createUser: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserCreationService, useValue: userCreationServiceMock },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new CustomValidationPipe());
    await app.init();
  });

  describe('createUser /api/users (POST) ', () => {
    beforeEach(() => {
      const mockUser = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedpassword',
      };
      userCreationServiceMock.createUser = jest
        .fn()
        .mockResolvedValue(mockUser);
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
          expect(body.user.name).toEqual('John Doe');
          expect(body.user.email).toEqual('john@example.com');
        });
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
            expect(body.user.name).toEqual('John Doe');
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
            expect(body.user.email).toEqual('john@example.com');
          });
      });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
