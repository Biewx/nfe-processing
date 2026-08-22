import { UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import LoginService from "./login.service";

describe("LoginService", () => {
    let service: LoginService;
    let fakeRepository: { findUserByEmail: jest.Mock };
    let fakeJwtService: { signAsync: jest.Mock };

    beforeEach(() => {
        fakeRepository = {
            findUserByEmail: jest.fn(),
        };
        fakeJwtService = {
            signAsync: jest.fn(),
        };
        service = new LoginService(fakeRepository as any, fakeJwtService as any);
    });

    it("lança UnauthorizedException se o e-mail não estiver cadastrado", async () => {
        // Arrange
        fakeRepository.findUserByEmail.mockResolvedValue(null);

        // Act + Assert
        await expect(
            service.login({ email: "ninguem@aqui.com", password: "qualquer" }),
        ).rejects.toThrow(UnauthorizedException);
        expect(fakeJwtService.signAsync).not.toHaveBeenCalled();
    });

    it("lança UnauthorizedException se a senha estiver errada", async () => {
        // Arrange: hash de verdade de uma senha diferente da que vai ser testada
        const passwordHash = await bcrypt.hash("senhaCorreta", 10);
        fakeRepository.findUserByEmail.mockResolvedValue({
            id: 1,
            email: "ze@padaria.com",
            passwordHash,
            companyId: 5,
        });

        // Act + Assert
        await expect(
            service.login({ email: "ze@padaria.com", password: "senhaErrada" }),
        ).rejects.toThrow(UnauthorizedException);
        expect(fakeJwtService.signAsync).not.toHaveBeenCalled();
    });

    it("devolve um accessToken quando e-mail e senha conferem", async () => {
        // Arrange
        const passwordHash = await bcrypt.hash("senhaCorreta", 10);
        fakeRepository.findUserByEmail.mockResolvedValue({
            id: 1,
            email: "ze@padaria.com",
            passwordHash,
            companyId: 5,
        });
        fakeJwtService.signAsync.mockResolvedValue("token.assinado.aqui");

        // Act
        const result = await service.login({ email: "ze@padaria.com", password: "senhaCorreta" });

        // Assert: o token carrega o id do usuário e a empresa dele, pro
        // JwtAuthGuard conseguir devolver isso depois em request.user
        expect(fakeJwtService.signAsync).toHaveBeenCalledWith({
            sub: 1,
            email: "ze@padaria.com",
            companyId: 5,
        });
        expect(result).toEqual({ accessToken: "token.assinado.aqui" });
    });
});
