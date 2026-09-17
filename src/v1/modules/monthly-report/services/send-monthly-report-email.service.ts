import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

@Injectable()
export default class SendMonthlyReportEmailService {
    private readonly transporter: nodemailer.Transporter;

    constructor(private readonly configService: ConfigService) {
        // Brevo SMTP, remetente individual verificado (decisão do addendum
        // do PRD) -- credenciais via .env, mesmo padrão que o segredo do JWT
        // já usa (ver AuthModule).
        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>("BREVO_SMTP_HOST"),
            port: this.configService.get<number>("BREVO_SMTP_PORT"),
            auth: {
                user: this.configService.get<string>("BREVO_SMTP_USER"),
                pass: this.configService.get<string>("BREVO_SMTP_PASS"),
            },
        });
    }

    // AD-5: 1 única chamada sendMail por empresa, com todos os usuários no
    // campo "to" -- não é um envio por usuário. Falha de qualquer endereço
    // (rejeitado pelo SMTP) propaga como exceção; quem decide o que fazer
    // com isso é o coordinator (AD-7 -- isolamento por empresa).
    async sendMonthlyReport(recipients: string[], subject: string, html: string): Promise<void> {
        await this.transporter.sendMail({
            from: this.configService.get<string>("BREVO_SENDER_EMAIL"),
            to: recipients.join(", "),
            subject,
            html,
        });
    }
}
