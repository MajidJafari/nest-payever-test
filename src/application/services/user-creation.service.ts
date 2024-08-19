import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository';
import { randomBytes, pbkdf2Sync } from 'crypto';
import { IUser } from '../../domain/interfaces/user.interface';

@Injectable()
export class UserCreationService {
  constructor(
    @(Inject('UserRepository') as any)
    private readonly userRepository: IUserRepository,
  ) {}

  private hashPassword(password: string): { salt: string; hash: string } {
    const salt = randomBytes(16).toString('hex');
    const hash = pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString(
      'hex',
    );
    return { salt, hash };
  }

  async createUser(
    name: string,
    email: string,
    password: string,
  ): Promise<IUser> {
    const { salt, hash } = this.hashPassword(password);

    const savedUser = await this.userRepository.save({
      name,
      email,
      password: {
        hash,
        salt,
      },
    });

    return savedUser;
  }
}
