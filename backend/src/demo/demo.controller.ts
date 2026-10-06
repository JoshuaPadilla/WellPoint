import { Body, Controller, HttpCode, Post, UsePipes } from '@nestjs/common';
import { DemoService } from './demo.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { simulateSchema } from '../common/schemas';

@Controller('api/demo')
export class DemoController {
  constructor(private readonly demo: DemoService) {}

  @Post('simulate')
  @UsePipes(new ZodValidationPipe(simulateSchema))
  @HttpCode(204)
  async simulate(@Body() body: unknown): Promise<void> {
    await this.demo.simulate(body as never);
  }

  @Post('reset')
  @HttpCode(204)
  async reset(): Promise<void> {
    await this.demo.reset();
  }
}
