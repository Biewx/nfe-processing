import { UnauthorizedException } from "@nestjs/common";
import { JwtAuthGuard } from "./jwt-auth.guard";

// Monta um ExecutionContext falso, só com o suficiente pro guard conseguir
// chamar context.switchToHttp().getRequest() e receber a request fake.
function fakeExecutionContext(request: any) {
    return {
        switchToHttp: () => ({
            getRequest: () => request,
        }),
    } as any;
}

describe("JwtAuthGuard", () => {
    let guard: JwtAuthGuard;
    let fakeJwtService: { verifyAsync: jest.Mock };

    beforeEach(() => {
        fakeJwtService = {
            verifyAsync: jest.fn(),
        };
        guard = new JwtAuthGuard(fakeJwtService as any);
    });

    it("lança UnauthorizedException se não houver header Authorization", async () => {
        // Arrange
        const context = fakeExecutionContext({ headers: {} });

        // Act + Assert
        await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
        expect(fakeJwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it("lança UnauthorizedException se o header não for do tipo Bearer", async () => {
        // Arrange
        const context = fakeExecutionContext({
            headers: { authorization: "Basic algumacoisa" },
        });

        // Act + Assert
        await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
        expect(fakeJwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it("lança UnauthorizedException se o token for inválido ou expirado", async () => {
        // Arrange
        const context = fakeExecutionContext({
            headers: { authorization: "Bearer token.invalido" },
        });
        fakeJwtService.verifyAsync.mockRejectedValue(new Error("jwt expired"));

        // Act + Assert
        await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it("permite a passagem e guarda o payload em request.user quando o token é válido", async () => {
        // Arrange
        const request: any = {
            headers: { authorization: "Bearer token.valido" },
        };
        const context = fakeExecutionContext(request);
        const payload = { sub: 1, email: "ze@padaria.com", companyId: 5 };
        fakeJwtService.verifyAsync.mockResolvedValue(payload);

        // Act
        const result = await guard.canActivate(context);

        // Assert
        expect(result).toBe(true);
        expect(request.user).toEqual(payload);
    });
});
