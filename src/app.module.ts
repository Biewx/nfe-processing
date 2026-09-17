import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { InvoiceModule } from './v1/modules/invoice/invoice.module';
import { AnalyticsModule } from './v1/modules/analytics/analytics.module';
import { InsightsModule } from './v1/modules/insights/insights.module';
import { AuthModule } from './v1/modules/auth/auth.module';
import { MonthlyReportModule } from './v1/modules/monthly-report/monthly-report.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Sem isso os @Cron de monthly-report (agendamento mensal + drain, AD-6)
    // compilam mas nunca disparam -- achado real da Reviewer Gate da Architecture.
    ScheduleModule.forRoot(),
    AuthModule,
    InvoiceModule,
    AnalyticsModule,
    InsightsModule,
    MonthlyReportModule
  ],
})
export class AppModule {}