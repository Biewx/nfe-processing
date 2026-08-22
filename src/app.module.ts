import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InvoiceModule } from './v1/modules/invoice/invoice.module';
import { AnalyticsModule } from './v1/modules/analytics/analytics.module';
import { InsightsModule } from './v1/modules/insights/insights.module';
import { AuthModule } from './v1/modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    InvoiceModule,
    AnalyticsModule,
    InsightsModule
  ],
})
export class AppModule {}