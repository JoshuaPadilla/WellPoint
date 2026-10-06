import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import dbConfig from './config/db.config';
import { SourcesModule } from './sources/sources.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [dbConfig],
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
  providers: [AppService],
})
export class AppModule {}
