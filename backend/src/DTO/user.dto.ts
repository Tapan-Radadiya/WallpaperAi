import { IsEmail, IsString, IsUrl } from 'class-validator';

export class RegisterUserDTO {
    @IsString({ message: "Invalid Display Name" })
    displayName: string

    @IsEmail()
    emailId: string

    
}