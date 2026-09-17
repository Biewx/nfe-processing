const sendMailMock = jest.fn();

jest.mock("nodemailer", () => ({
    createTransport: jest.fn(() => ({ sendMail: sendMailMock })),
}));

import SendMonthlyReportEmailService from "./send-monthly-report-email.service";

describe("SendMonthlyReportEmailService", () => {
    let service: SendMonthlyReportEmailService;
    let fakeConfigService: { get: jest.Mock };

    beforeEach(() => {
        sendMailMock.mockReset().mockResolvedValue(undefined);
        fakeConfigService = {
            get: jest.fn((key: string) => `fake-${key}`),
        };
        service = new SendMonthlyReportEmailService(fakeConfigService as any);
    });

    it("envia 1 única mensagem com todos os destinatários no campo 'to' (AD-5)", async () => {
        // Act
        await service.sendMonthlyReport(
            ["dono@mercadinho.com", "socia@mercadinho.com"],
            "Relatório Mensal de Compras — 8/2026",
            "<h1>...</h1>",
        );

        // Assert
        expect(sendMailMock).toHaveBeenCalledTimes(1);
        expect(sendMailMock).toHaveBeenCalledWith({
            from: "fake-BREVO_SENDER_EMAIL",
            to: "dono@mercadinho.com, socia@mercadinho.com",
            subject: "Relatório Mensal de Compras — 8/2026",
            html: "<h1>...</h1>",
        });
    });

    it("propaga a exceção quando o transporte SMTP falha (quem isola por empresa é o coordinator, AD-7)", async () => {
        // Arrange
        sendMailMock.mockRejectedValue(new Error("SMTP timeout"));

        // Act & Assert
        await expect(
            service.sendMonthlyReport(["dono@mercadinho.com"], "assunto", "<p>...</p>"),
        ).rejects.toThrow("SMTP timeout");
    });
});
