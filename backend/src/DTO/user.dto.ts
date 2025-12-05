import { IsEmail, IsString, IsStrongPassword, IsUrl } from 'class-validator';

export class RegisterUserDTO {
    @IsString({ message: "Invalid Display Name" })
    displayName: string

    @IsEmail()
    emailId: string

    @IsStrongPassword()
    password: string
}

export class LoginUserDTO {
    @IsEmail()
    emailId: string

    @IsString()
    password: string
}