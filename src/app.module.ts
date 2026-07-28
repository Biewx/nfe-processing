import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InvoiceModule } from './v1/modules/invoice/invoice.module';
import { AnalyticsModule } from './v1/modules/analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    InvoiceModule,
    AnalyticsModule
  ],
})
export class AppModule {}