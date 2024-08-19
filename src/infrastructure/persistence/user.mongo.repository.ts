import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IUserRepository } from '../../domain/repositories/user.repository';
import { IUser } from '../../domain/interfaces/user.interface';
import { UserDocument } from '../schemas/user.schema';

@Injectable()
export class UserMongoRepository implements IUserRepository {
  constructor(
    @(InjectModel('User') as any)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async save(user: IUser): Promise<IUser> {
    return (await this.userModel.create(user)) as IUser;
  }
}
