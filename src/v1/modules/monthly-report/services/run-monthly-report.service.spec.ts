import RunMonthlyReportService from "./run-monthly-report.service";

describe("RunMonthlyReportService", () => {
    let service: RunMonthlyReportService;
    let fakeRepository: {
        findAllCompanyIds: jest.Mock;
        countUsersByCompany: jest.Mock;
        createPendingRuns: jest.Mock;
        findDuePendingRuns: jest.Mock;
        claimRun: jest.Mock;
        markSent: jest.Mock;
        markFailed: jest.Mock;
    };
    let fakeEligibilityService: { isEligible: jest.Mock };
    let fakeComposeService: { composeFullReport: jest.Mock };
    let fakeRenderService: { render: jest.Mock };
    let fakeSendService: { sendMonthlyReport: jest.Mock };

    beforeEach(() => {
        // 1º de setembro/2026 -- mês de referência esperado é agosto/2026
        jest.useFakeTimers().setSystemTime(new Date(2026, 8, 1, 0, 0, 0));

        fakeRepository = {
            findAllCompanyIds: jest.fn(),
            countUsersByCompany: jest.fn(),
            createPendingRuns: jest.fn(),
            findDuePendingRuns: jest.fn(),
            claimRun: jest.fn(),
            markSent: jest.fn(),
            markFailed: jest.fn(),
        };
        fakeEligibilityService = {
            isEligible: jest.fn(),
        };
        fakeComposeService = {
            composeFullReport: jest.fn(),
        };
        fakeRenderService = {
            render: jest.fn(),
        };
        fakeSendService = {
            sendMonthlyReport: jest.fn(),
        };
        service = new RunMonthlyReportService(
            fakeRepository as any,
            fakeEligibilityService as any,
            fakeComposeService as any,
            fakeRenderService as any,
            fakeSendService as any,
        );
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("não cria nenhuma linha quando não há empresa alguma cadastrada", async () => {
        // Arrange
        fakeRepository.findAllCompanyIds.mockResolvedValue([]);

        // Act
        await service.scheduleMonthlyCycle();

        // Assert
        expect(fakeRepository.createPendingRuns).not.toHaveBeenCalled();
    });

    it("não cria nenhuma linha quando nenhuma empresa é elegível", async () => {
        // Arrange
        fakeRepository.findAllCompanyIds.mockResolvedValue([1, 2]);
        fakeEligibilityService.isEligible.mockResolvedValue(false);

        // Act
        await service.scheduleMonthlyCycle();

        // Assert
        expect(fakeRepository.createPendingRuns).not.toHaveBeenCalled();
    });

    it("agenda o mês de referência correto (mês anterior completo -- FR-5)", async () => {
        // Arrange
        fakeRepository.findAllCompanyIds.mockResolvedValue([1]);
        fakeEligibilityService.isEligible.mockResolvedValue(true);
        fakeRepository.countUsersByCompany.mockResolvedValue(new Map([[1, 2]]));

        // Act
        await service.scheduleMonthlyCycle();

        // Assert: hoje é 1º de setembro/2026 -> mês de referência é agosto/2026
        expect(fakeRepository.createPendingRuns).toHaveBeenCalledWith([
            expect.objectContaining({ companyId: 1, referenceMonth: 8, referenceYear: 2026 }),
        ]);
    });

    it("não agenda empresa elegível sem nenhum usuário cadastrado (achado no code-review)", async () => {
        // Arrange: empresa 1 tem usuários, empresa 2 não tem nenhum
        fakeRepository.findAllCompanyIds.mockResolvedValue([1, 2]);
        fakeEligibilityService.isEligible.mockResolvedValue(true);
        fakeRepository.countUsersByCompany.mockResolvedValue(new Map([[1, 2]])); // empresa 2 não aparece no Map

        // Act
        await service.scheduleMonthlyCycle();

        // Assert: só a empresa 1 é agendada
        const [entries] = fakeRepository.createPendingRuns.mock.calls[0];
        expect(entries).toHaveLength(1);
        expect(entries[0].companyId).toBe(1);
    });

    it("agenda tudo pra agora quando o total de destinatários não passa do limiar", async () => {
        // Arrange: 2 empresas, 100 usuários cada -- total 200, abaixo de 250
        fakeRepository.findAllCompanyIds.mockResolvedValue([1, 2]);
        fakeEligibilityService.isEligible.mockResolvedValue(true);
        fakeRepository.countUsersByCompany.mockResolvedValue(
            new Map([
                [1, 100],
                [2, 100],
            ]),
        );

        // Act
        await service.scheduleMonthlyCycle();

        // Assert
        const [entries] = fakeRepository.createPendingRuns.mock.calls[0];
        const now = new Date(2026, 8, 1, 0, 0, 0);
        expect(entries).toEqual([
            expect.objectContaining({ companyId: 1, scheduledAt: now }),
            expect.objectContaining({ companyId: 2, scheduledAt: now }),
        ]);
    });

    it("distribui por múltiplos dias quando o total passa de 250, sem estourar ~280/dia (AD-6)", async () => {
        // Arrange: 3 empresas de 150 usuários cada -- total 450, passa de 250.
        // 150 + 150 = 300 já estouraria 280, então cada empresa fica sozinha
        // no seu dia.
        fakeRepository.findAllCompanyIds.mockResolvedValue([1, 2, 3]);
        fakeEligibilityService.isEligible.mockResolvedValue(true);
        fakeRepository.countUsersByCompany.mockResolvedValue(
            new Map([
                [1, 150],
                [2, 150],
                [3, 150],
            ]),
        );

        // Act
        await service.scheduleMonthlyCycle();

        // Assert
        const [entries] = fakeRepository.createPendingRuns.mock.calls[0];
        const days = entries.map((e: { scheduledAt: Date }) => e.scheduledAt.getDate());
        expect(new Set(days).size).toBe(3); // 3 dias diferentes, 1 empresa por dia
        expect(Math.min(...days)).toBe(1); // primeiro dia é hoje (1º de setembro)
    });

    it("cabe mais de uma empresa no mesmo dia quando a soma não estoura o limite diário", async () => {
        // Arrange: 3 empresas de 100 usuários -- total 300 (> 250, aciona
        // distribuição), mas 100+100 = 200 cabe no mesmo dia (<= 280); a
        // terceira (100+100+100=300 > 280) vai pro dia seguinte.
        fakeRepository.findAllCompanyIds.mockResolvedValue([1, 2, 3]);
        fakeEligibilityService.isEligible.mockResolvedValue(true);
        fakeRepository.countUsersByCompany.mockResolvedValue(
            new Map([
                [1, 100],
                [2, 100],
                [3, 100],
            ]),
        );

        // Act
        await service.scheduleMonthlyCycle();

        // Assert
        const [entries] = fakeRepository.createPendingRuns.mock.calls[0];
        const days = entries.map((e: { scheduledAt: Date }) => e.scheduledAt.getDate());
        expect(days).toEqual([1, 1, 2]);
    });

    describe("drainPendingRuns", () => {
        const dueRun = {
            id: 1,
            companyId: 10,
            referenceMonth: 8,
            referenceYear: 2026,
            company: {
                name: "Mercado do Zé",
                users: [{ email: "dono@mercadinho.com" }, { email: "socia@mercadinho.com" }],
            },
        };

        it("não faz nada quando não há nenhuma linha PENDING vencida", async () => {
            // Arrange
            fakeRepository.findDuePendingRuns.mockResolvedValue([]);

            // Act
            await service.drainPendingRuns();

            // Assert
            expect(fakeRepository.claimRun).not.toHaveBeenCalled();
        });

        it("pula a linha quando não consegue reivindicá-la (outro tick já pegou, AD-5)", async () => {
            // Arrange
            fakeRepository.findDuePendingRuns.mockResolvedValue([dueRun]);
            fakeRepository.claimRun.mockResolvedValue(false);

            // Act
            await service.drainPendingRuns();

            // Assert
            expect(fakeComposeService.composeFullReport).not.toHaveBeenCalled();
            expect(fakeSendService.sendMonthlyReport).not.toHaveBeenCalled();
        });

        it("compõe, renderiza e envia pra todos os usuários da empresa, e marca SENT", async () => {
            // Arrange
            fakeRepository.findDuePendingRuns.mockResolvedValue([dueRun]);
            fakeRepository.claimRun.mockResolvedValue(true);
            const report = { savingsOpportunities: [], priceIncreaseAlerts: [], normalSituationMessage: "ok", mainSupplier: null };
            fakeComposeService.composeFullReport.mockResolvedValue(report);
            fakeRenderService.render.mockReturnValue({ subject: "assunto", html: "<p>...</p>" });

            // Act
            await service.drainPendingRuns();

            // Assert
            expect(fakeComposeService.composeFullReport).toHaveBeenCalledWith(10, 8, 2026);
            expect(fakeRenderService.render).toHaveBeenCalledWith("Mercado do Zé", 8, 2026, report);
            expect(fakeSendService.sendMonthlyReport).toHaveBeenCalledWith(
                ["dono@mercadinho.com", "socia@mercadinho.com"],
                "assunto",
                "<p>...</p>",
            );
            expect(fakeRepository.markSent).toHaveBeenCalledWith(1);
            expect(fakeRepository.markFailed).not.toHaveBeenCalled();
        });

        it("marca FAILED e segue pra próxima linha quando o envio de uma empresa falha (AD-7)", async () => {
            // Arrange: 2 empresas no mesmo lote -- a primeira falha, a segunda deve continuar
            const secondRun = { ...dueRun, id: 2, companyId: 20 };
            fakeRepository.findDuePendingRuns.mockResolvedValue([dueRun, secondRun]);
            fakeRepository.claimRun.mockResolvedValue(true);
            fakeComposeService.composeFullReport.mockResolvedValue({
                savingsOpportunities: [],
                priceIncreaseAlerts: [],
                normalSituationMessage: "ok",
                mainSupplier: null,
            });
            fakeRenderService.render.mockReturnValue({ subject: "assunto", html: "<p>...</p>" });
            fakeSendService.sendMonthlyReport
                .mockRejectedValueOnce(new Error("SMTP timeout"))
                .mockResolvedValueOnce(undefined);

            // Act
            await service.drainPendingRuns();

            // Assert
            expect(fakeRepository.markFailed).toHaveBeenCalledWith(1, "SMTP timeout");
            expect(fakeRepository.markSent).toHaveBeenCalledWith(2);
        });
    });
});
