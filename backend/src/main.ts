import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true });
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  Logger.log(
    `WellPoint API listening on http://localhost:${port}`,
    'Bootstrap',
  );
}
void bootstrap();
