import { IAvatar } from '../interfaces/avatar.interface';

export interface IAvatarRepository {
  findByUserId(userId: string): Promise<IAvatar | null>;
  save(avatar: IAvatar): Promise<IAvatar>;
  deleteByUserId(userId: string): Promise<void>;
}
