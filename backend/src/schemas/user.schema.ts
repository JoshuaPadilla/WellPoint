import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GoogleUserSchema = z.object({
  googleSub: z.string().min(1),
  email: z.string().trim().toLowerCase().email(),
  givenName: z.string().trim().min(1, 'Given name is required'),
  familyName: z.string().trim().min(1, 'Family name is required'),
  profileUrl: z.string().url().optional(),
});

export class GoogleUserDto extends createZodDto(GoogleUserSchema) {}
