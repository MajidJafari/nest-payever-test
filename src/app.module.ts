import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserMongoRepository } from './infrastructure/persistence/user.mongo.repository';
import { UserController } from './interfaces/rest/user.controller';
import { UserCreationService } from './application/services/user-creation.service';
import { UserSchema } from './infrastructure/schemas/user.schema';

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
    { provide: 'UserRepository', useClass: UserMongoRepository },
  ],
})
export class AppModule {}
