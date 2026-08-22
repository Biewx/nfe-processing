import { createParamDecorator, ExecutionContext } from "@nestjs/common";

// Usa assim num controller: metodo(@CurrentUser() user) { ... }
// O JwtAuthGuard já deixou os dados do token guardados em request.user --
// esse decorator só é um jeito mais curto de pegar isso, em vez de escrever
// @Req() request e depois request.user toda vez.
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
});
