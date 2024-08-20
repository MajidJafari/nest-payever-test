import {
  Controller,
  Post,
  Body,
  ConflictException,
  Get,
  Param,
  NotFoundException,
  BadRequestException,
  Delete,
} from '@nestjs/common';
import { UserCreationService } from '../../application/services/user-creation.service';
import { CreateUserDto, UserResponseDto } from './dtos/user.dto';
import { UserService } from '../../application/services/user.service';
import { AvatarService } from '../../application/services/avatar.service';

@Controller('users')
export class UserController {
  constructor(
    private readonly userCreationService: UserCreationService,
    private readonly userService: UserService,
    private readonly avatarService: AvatarService,
  ) {}

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
    const user = await this.userService.getUser(id);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return user;
  }

  @Get('/:id/avatar')
  async getUserAvatar(@Param('id') id: string) {
    const user = await this.getUser(id);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const { isVerified, base64Avatar } = await this.avatarService.getAvatar(
      id,
      user.avatar,
    );
    if (!isVerified) {
      throw new BadRequestException('It seems that your file is corrupted.');
    }
    return { base64Avatar };
  }

  @Delete(':id/avatar')
  async deleteUserAvatar(@Param('id') id: string) {
    await this.avatarService.deleteAvatar(id);
    return null;
  }
}
