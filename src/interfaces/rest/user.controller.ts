import {
  Controller,
  Post,
  Body,
  ConflictException,
  Get,
  Param,
} from '@nestjs/common';
import { UserCreationService } from '../../application/services/user-creation.service';
import { CreateUserDto, UserResponseDto } from './dtos/user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userCreationService: UserCreationService) {}

  @Post('/')
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    const {
      name: dtoName,
      email: dtoEmail,
      password: dtoPassword,
    } = createUserDto;

    try {
      const { id, name, email } = await this.userCreationService.createUser(
        dtoName,
        dtoEmail,
        dtoPassword,
      );

      return { id, name, email };
    } catch (e) {
      if (e.code === 11000) {
        throw new ConflictException('User with the same email exist.');
      }
      throw e;
    }
  }

  @Get('/:id')
  async getUser(@Param('id') id: string) {
    const userApi = await fetch(`https://reqres.in/api/users/${id}`);
    const json = await userApi.json();
    return json.data || null;
  }
}
