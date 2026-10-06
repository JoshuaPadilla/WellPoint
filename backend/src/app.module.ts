import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtAuthGuard } from './common/auth/jwt-auth.guard';
import { PermissionGuard } from './common/rbac/permission.guard';
import authConfig from './config/auth.config';
import dbConfig from './config/db.config';
<<<<<<< HEAD
import { SourcesModule } from './sources/sources.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
=======
import { AuthModule } from './modules/auth/auth.module';
import { SourcesModule } from './modules/sources/sources.module';
import { UsersModule } from './modules/users/users.module';
>>>>>>> 749e17a457eab9060077de9a39c47247cde4094b

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [dbConfig, authConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const connString = configService.getOrThrow<string>(
          'database.connString',
        );
        return {
          type: 'postgres',
          url: connString,
          ssl: connString.includes('supabase')
            ? { rejectUnauthorized: false }
            : undefined,
          autoLoadEntities: true,
          synchronize: true, // prototype only — auto-creates tables from entities
        };
      },
    }),
    SourcesModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global guards run in registration order: attach the user first, then
    // enforce the handler's declared permissions.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
  ],
})
export class AppModule {}
