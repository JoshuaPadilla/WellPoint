import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import databaseConfig from './config/database.config';
import googleAuthConfig from './config/google-auth.config';
import jwtConfig from './config/jwt.config';
import { SeedModule } from './db/seed/seed.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WaterModule } from './modules/water/water.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [googleAuthConfig, jwtConfig, databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host', 'localhost'),
        port: config.get<number>('database.port', 5432),
        username: config.get<string>('database.username', 'wellpoint'),
        password: config.get<string>('database.password', 'wellpoint'),
        database: config.get<string>('database.name', 'wellpoint'),
        autoLoadEntities: true,
        synchronize: config.get<boolean>('database.synchronize', true),
      }),
    }),
    AuthModule,
    UsersModule,
    SeedModule,
    JwtModule,
    WaterModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
