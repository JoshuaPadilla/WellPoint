import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  connString: process.env.DB_CONN_STRING,
}));
