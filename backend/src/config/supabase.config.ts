import { registerAs } from '@nestjs/config';

export default registerAs('supabase', () => ({
  url: process.env.SUPABASE_URL,
  jwtSecret: process.env.SUPABASE_JWT_SECRET,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
}));
