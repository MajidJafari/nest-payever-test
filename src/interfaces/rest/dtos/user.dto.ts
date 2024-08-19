import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { IUser } from '../../../domain/interfaces/user.interface';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => typeof value === 'string' && value.trim())
  name!: string;

  @IsEmail()
  @Transform(
    ({ value }) => typeof value === 'string' && value.toLowerCase().trim(),
  )
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class UserResponseDto implements Omit<IUser, 'password' | 'salt'> {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsEmail()
  email!: string;
}
