import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'wellpoint',
  password: process.env.DB_PASSWORD ?? 'wellpoint',
  name: process.env.DB_NAME ?? 'wellpoint',
  synchronize: (process.env.DB_SYNC ?? 'true') === 'true',
}));
