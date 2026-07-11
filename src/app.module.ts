import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InvoiceModule } from './v1/modules/invoice/invoice.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    InvoiceModule,
  ],
})
export class AppModule {}