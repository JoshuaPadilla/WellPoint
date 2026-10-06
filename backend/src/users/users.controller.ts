import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserRoles } from '../common/enum/user_roles.enum';
import { Permissions } from '../common/rbac/permissions.decorator';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions('user:manage')
  async list() {
    return this.usersService.findAll();
  }

  @Patch(':id/role')
  @Permissions('user:manage')
  async changeRole(@Param('id') id: string, @Body() body: { role?: string }) {
    const role = body.role as UserRoles | undefined;
    if (!role || !Object.values(UserRoles).includes(role)) {
      throw new BadRequestException('Invalid role');
    }
    const updated = await this.usersService.updateRole(id, role);
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }
}
