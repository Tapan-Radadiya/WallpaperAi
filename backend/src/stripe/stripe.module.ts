import { Module } from '@nestjs/common';
import { ImageModule } from 'src/image/image.module';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';

@Module({
  imports: [ImageModule],
  providers: [StripeService],
  controllers: [StripeController]
})
export class StripeModule { }
