import { Body, Controller, Post } from "@nestjs/common";
import RegisterService from "./services/register.service";
import LoginService from "./services/login.service";
import { RegisterDto } from "./dtos/register.dto";
import { LoginDto } from "./dtos/login.dto";

@Controller('auth')
export default class AuthController {
    constructor(
        private readonly registerService: RegisterService,
        private readonly loginService: LoginService,
    ) {}

    @Post('register')
    register(@Body() dto: RegisterDto) {
        return this.registerService.register(dto);
    }

    @Post('login')
    login(@Body() dto: LoginDto) {
        return this.loginService.login(dto);
    }
}
