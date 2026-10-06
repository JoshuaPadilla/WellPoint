import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  backendUrl: process.env.BACKEND_URL ?? 'http://localhost:4000',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
}));
