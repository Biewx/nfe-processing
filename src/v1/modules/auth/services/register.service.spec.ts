import { ConflictException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import RegisterService from "./register.service";

describe("RegisterService", () => {
    let service: RegisterService;
    let fakeRepository: {
        findUserByEmail: jest.Mock;
        createCompanyWithUser: jest.Mock;
    };

    beforeEach(() => {
        fakeRepository = {
            findUserByEmail: jest.fn(),
            createCompanyWithUser: jest.fn(),
        };
        service = new RegisterService(fakeRepository as any);
    });

    it("lança ConflictException se já existir um usuário com esse e-mail", async () => {
        // Arrange
        fakeRepository.findUserByEmail.mockResolvedValue({ id: 1, email: "ja@existe.com" });

        // Act + Assert
        await expect(
            service.register({ companyName: "Padaria do Zé", email: "ja@existe.com", password: "senha1234" }),
        ).rejects.toThrow(ConflictException);

        // não deve tentar criar nada se já existe conta com esse e-mail
        expect(fakeRepository.createCompanyWithUser).not.toHaveBeenCalled();
    });

    it("cria a empresa e o usuário com a senha em hash, não em texto puro", async () => {
        // Arrange
        fakeRepository.findUserByEmail.mockResolvedValue(null);
        fakeRepository.createCompanyWithUser.mockImplementation((companyName, email, passwordHash) => {
            return Promise.resolve({
                id: 10,
                name: companyName,
                users: [{ id: 100, email, passwordHash }],
            });
        });

        // Act
        const result = await service.register({
            companyName: "Padaria do Zé",
            email: "ze@padaria.com",
            password: "senha1234",
        });

        // Assert: o que foi salvo não é a senha original...
        const [, , passwordHashSalvo] = fakeRepository.createCompanyWithUser.mock.calls[0];
        expect(passwordHashSalvo).not.toBe("senha1234");

        // ...mas um hash que corresponde a ela, quando comparado de verdade
        const senhaConfere = await bcrypt.compare("senha1234", passwordHashSalvo);
        expect(senhaConfere).toBe(true);

        // e o retorno do service não vaza o hash pra fora
        expect(result).toEqual({
            companyId: 10,
            companyName: "Padaria do Zé",
            userId: 100,
            email: "ze@padaria.com",
        });
    });
});
