import { IUser, IUserCreate } from '../interfaces/user.interface';

export interface IUserRepository {
  save(user: IUserCreate): Promise<IUser>;
  removeAll(): Promise<void>;
}
