import { Module } from "@nestjs/common";
import { PrismaModule } from "prisma/prisma.module";
import { InsightsModule } from "../insights/insights.module";
import { AnalyticsModule } from "../analytics/analytics.module";
import MonthlyReportRepository from "./repositories/monthly-report.repository";
import CheckReportEligibilityService from "./services/check-report-eligibility.service";
import ComposeMonthlyReportService from "./services/compose-monthly-report.service";
import RenderMonthlyReportEmailService from "./services/render-monthly-report-email.service";
import SendMonthlyReportEmailService from "./services/send-monthly-report-email.service";
import RunMonthlyReportService from "./services/run-monthly-report.service";

@Module({
    imports: [PrismaModule, InsightsModule, AnalyticsModule],
    providers: [
        MonthlyReportRepository,
        CheckReportEligibilityService,
        ComposeMonthlyReportService,
        RenderMonthlyReportEmailService,
        SendMonthlyReportEmailService,
        RunMonthlyReportService,
    ]
})
export class MonthlyReportModule {}
