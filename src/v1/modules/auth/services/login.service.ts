import { Injectable, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { JwtService } from "@nestjs/jwt";
import AuthRepository from "../repositories/auth.repository";
import { LoginDto } from "../dtos/login.dto";

@Injectable()
export default class LoginService {
    constructor(
        private readonly authRepository: AuthRepository,
        private readonly jwtService: JwtService,
    ) {}

    async login(dto: LoginDto) {
        const user = await this.authRepository.findUserByEmail(dto.email);

        // a mesma mensagem serve pros dois casos ("email não existe" e
        // "senha errada") de propósito -- se a mensagem fosse diferente,
        // alguém tentando adivinhar contas conseguiria descobrir quais
        // e-mails estão cadastrados só de olhar a resposta.
        if (!user) {
            throw new UnauthorizedException("E-mail ou senha inválidos.");
        }

        const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
        if (!passwordMatches) {
            throw new UnauthorizedException("E-mail ou senha inválidos.");
        }

        // "sub" (subject) é o nome convencional pro id do dono do token --
        // não é obrigatório chamar assim, mas é o padrão que outras
        // ferramentas de JWT esperam encontrar.
        const accessToken = await this.jwtService.signAsync({
            sub: user.id,
            email: user.email,
            companyId: user.companyId,
        });

        return { accessToken };
    }
}
