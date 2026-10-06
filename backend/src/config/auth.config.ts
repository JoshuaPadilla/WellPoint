import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwtSecret: process.env.APP_JWT_SECRET ?? process.env.SUPABASE_JWT_SECRET,
  backendUrl: process.env.BACKEND_URL ?? 'http://localhost:4000',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
}));
