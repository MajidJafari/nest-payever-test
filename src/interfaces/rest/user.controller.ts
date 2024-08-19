import { Controller, Post, Body } from '@nestjs/common';
import { UserCreationService } from '../../application/services/user-creation.service';
import { CreateUserDto, UserResponseDto } from './dtos/user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userCreationService: UserCreationService) {}

  @Post('/')
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<{ user: UserResponseDto }> {
    const {
      name: dtoName,
      email: dtoEmail,
      password: dtoPassword,
    } = createUserDto;

    const { id, name, email } = await this.userCreationService.createUser(
      dtoName,
      dtoEmail,
      dtoPassword,
    );

    return { user: { id, name, email } };
  }
}
