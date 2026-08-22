import { ConflictException, Injectable } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import AuthRepository from "../repositories/auth.repository";
import { RegisterDto } from "../dtos/register.dto";

// Quanto maior, mais lento e mais seguro contra ataque de força bruta.
// 10 é o padrão recomendado hoje em dia -- alto o suficiente pra ser caro
// de quebrar, baixo o suficiente pra não travar o login por 1 segundo.
const SALT_ROUNDS = 10;

@Injectable()
export default class RegisterService {
    constructor(
        private readonly authRepository: AuthRepository
    ) {}

    async register(dto: RegisterDto) {
        const existingUser = await this.authRepository.findUserByEmail(dto.email);
        if (existingUser) {
            throw new ConflictException("Já existe uma conta com esse e-mail.");
        }

        // nunca guarda a senha em texto puro -- guarda só o hash. Nem o
        // próprio sistema consegue "ver" a senha de volta a partir dele.
        const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

        const company = await this.authRepository.createCompanyWithUser(
            dto.companyName,
            dto.email,
            passwordHash,
        );
        const user = company.users[0];

        return {
            companyId: company.id,
            companyName: company.name,
            userId: user.id,
            email: user.email,
        };
    }
}
