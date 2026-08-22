import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterDto {
    @IsString()
    @MaxLength(120)
    companyName: string;

    @IsEmail()
    email: string;

    // sem limite de tamanho declarado aqui de propósito -- o bcrypt já
    // trunca silenciosamente senhas muito longas, então validar um máximo
    // não ajuda em nada. Só o mínimo importa.
    @IsString()
    @MinLength(8)
    password: string;
}
