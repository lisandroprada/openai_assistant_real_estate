import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './schemas/user.schema';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(
      createUserDto.name,
      createUserDto.clientId,
      createUserDto.email,
      createUserDto.phoneNumber,
    );
  }

  @Get()
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User | null> {
    return this.usersService.findById(id);
  }

  @Get('/clients/:clientId')
  async findByClientId(@Param('clientId') clientId: string): Promise<User[]> {
    return this.usersService.findByClientId(clientId);
  }

  @Get('/clients/:clientId/usage')
  async getClientUsage(@Param('clientId') clientId: string) {
    const userCount = await this.usersService.getClientUserCount(clientId);
    return { clientId, userCount };
  }
}
