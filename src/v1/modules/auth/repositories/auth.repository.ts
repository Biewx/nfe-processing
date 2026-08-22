import { Injectable } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";

@Injectable()
export default class AuthRepository {
    constructor(
        private readonly prisma: PrismaService
    ) {}

    async findUserByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    // Cria a empresa e o primeiro usuário dela juntos, numa transação --
    // ou os dois são criados com sucesso, ou nenhum é. Sem isso, se a
    // criação do usuário falhasse por algum motivo, ficaria uma empresa
    // órfã no banco, sem ninguém pra logar nela.
    async createCompanyWithUser(companyName: string, email: string, passwordHash: string) {
        return this.prisma.company.create({
            data: {
                name: companyName,
                users: {
                    create: {
                        email,
                        passwordHash,
                    },
                },
            },
            include: {
                users: true,
            },
        });
    }
}
