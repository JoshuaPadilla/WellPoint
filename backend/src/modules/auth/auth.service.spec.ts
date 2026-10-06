jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));
jest.mock('../users/users.service', () => ({
  UsersService: class UsersService {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as passwordUtil from '../../common/auth/password.util';
import { UserRoles } from '../../common/enum/user_roles.enum';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;
  let moduleRef: TestingModule;
  let usersService: jest.Mocked<
    Pick<
      UsersService,
      'findByEmail' | 'findByEmailWithPassword' | 'count' | 'create'
    >
  >;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    };

    const configService = {
      getOrThrow: jest.fn().mockReturnValue('test-jwt-secret'),
    } as unknown as ConfigService;

    moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: ConfigService, useValue: configService },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();
    authService = moduleRef.get(AuthService);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await moduleRef.close();
  });

  it('persists the barangay during registration and includes it in the session', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.count.mockResolvedValue(1);
    usersService.create.mockImplementation((data) =>
      Promise.resolve({
        ...data,
        name: data.name,
        brgy: data.brgy,
        password: data.password ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    const session = await authService.register(
      'Barangay Official',
      'San Andres',
      'official@example.com',
      'password123',
    );

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Barangay Official',
        brgy: 'San Andres',
        email: 'official@example.com',
        role: UserRoles.STAFF,
      }),
    );
    expect(session.user.brgy).toBe('San Andres');
  });

  it('includes the persisted barangay in the session after login', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue({
      id: 'user-1',
      email: 'official@example.com',
      name: undefined,
      brgy: 'San Andres',
      password: 'salt:hash',
      role: UserRoles.STAFF,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    jest.spyOn(passwordUtil, 'verifyPassword').mockReturnValue(true);

    const session = await authService.login(
      'official@example.com',
      'password123',
    );

    expect(session.user).toMatchObject({
      id: 'user-1',
      name: null,
      brgy: 'San Andres',
      role: UserRoles.STAFF,
    });
  });
});
