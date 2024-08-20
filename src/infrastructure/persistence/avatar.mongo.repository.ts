import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IAvatarRepository } from '../../domain/repositories/avatar.repository';
import { AvatarDocument } from '../schemas/avatar.schema';
import { IAvatar } from 'src/domain/interfaces/avatar.interface';

@Injectable()
export class AvatarMongoRepository implements IAvatarRepository {
  constructor(
    @(InjectModel('Avatar') as any)
    private readonly avatarModel: Model<AvatarDocument>,
  ) {}

  async findByUserId(userId: string): Promise<IAvatar | null> {
    const avatar = await this.avatarModel.findOne({ userId });
    return avatar;
  }

  async save(avatar: IAvatar): Promise<IAvatar> {
    return this.avatarModel.create(avatar);
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.avatarModel.deleteOne({ userId });
  }
}
