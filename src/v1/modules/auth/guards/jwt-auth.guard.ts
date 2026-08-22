import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

// Coloca esse guard num controller (@UseGuards(JwtAuthGuard)) pra exigir
// login em todas as rotas dele. Ele lê o header "Authorization: Bearer <token>",
// confere se o token é válido, e -- se for -- guarda os dados de quem está
// logado em request.user, pro @CurrentUser() decorator conseguir ler depois.
@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException("Token de acesso não informado.");
        }

        try {
            const payload = await this.jwtService.verifyAsync(token);
            request.user = payload;
        } catch {
            throw new UnauthorizedException("Token de acesso inválido ou expirado.");
        }

        return true;
    }

    private extractTokenFromHeader(request: any): string | undefined {
        const authHeader = request.headers.authorization;
        if (!authHeader) {
            return undefined;
        }

        const parts = authHeader.split(' ');
        const type = parts[0];
        const token = parts[1];

        return type === 'Bearer' ? token : undefined;
    }
}
