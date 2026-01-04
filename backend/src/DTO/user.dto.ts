import { IsEmail, IsOptional, IsString, IsStrongPassword, IsUrl } from 'class-validator';

export class RegisterUserDTO {
    @IsString({ message: "Invalid Display Name" })
    displayName: string

    @IsEmail()
    emailId: string

    @IsStrongPassword()
    password: string

    @IsString({ message: "Invalid value for bio" })
    user_bio: string

    @IsOptional()
    @IsUrl()
    instagram_id?: string

    @IsOptional()
    @IsUrl()
    portfolio_url?: string
}

export class LoginUserDTO {
    @IsEmail()
    emailId: string

    @IsString()
    password: string
}