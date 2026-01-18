import { IsEmail, IsOptional, IsString, IsStrongPassword, IsUrl, Length, MaxLength, MinLength } from 'class-validator';

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

export class ResendVerificationEmailDTO {
    @IsEmail()
    emailId: string
}

export class UserVerificationDTO {
    @IsEmail()
    emailId: string

    @IsString()
    @Length(6, 6, { message: "Invalid VerificationCode" })
    verificationCode: string
}

export class UpdateUserDTO {
    @IsString({ message: "Invalid value for bio" })
    user_bio: string

    @IsOptional()
    @IsUrl()
    instagram_id?: string

    @IsOptional()
    @IsUrl()
    portfolio_url?: string
}