import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "prisma/prisma.service";
import AuthController from "./auth.controller";
import RegisterService from "./services/register.service";
import LoginService from "./services/login.service";
import AuthRepository from "./repositories/auth.repository";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@Module({
    imports: [
        // registerAsync + ConfigService em vez de JwtModule.register({ secret:
        // process.env.JWT_SECRET }) direto -- ler process.env no topo do
        // arquivo roda ANTES do dotenv terminar de carregar o .env (o
        // ConfigModule.forRoot() só carrega o .env quando o Nest de fato
        // inicializa os módulos, não quando esse arquivo é importado).
        // ConfigService busca o valor só na hora certa.
        JwtModule.registerAsync({
            global: true,
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '7d' },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [
        RegisterService,
        LoginService,
        AuthRepository,
        PrismaService,
        JwtAuthGuard,
    ],
    exports: [JwtAuthGuard],
})
export class AuthModule {}
