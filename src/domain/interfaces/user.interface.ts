export interface IUser {
  id: string;
  name: string;
  email: string;
  password: {
    hash: string;
    salt: string;
  };
}

export type IUserCreate = Omit<IUser, 'id'>;
