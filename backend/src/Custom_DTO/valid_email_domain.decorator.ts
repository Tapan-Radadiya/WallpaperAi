import { Injectable } from "@nestjs/common";
import { registerDecorator, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
import { ALLOWED_EMAILS_DOMAINS } from "../constants";

@ValidatorConstraint({ name: "IsValidEmailDomain", async: false })
@Injectable()
export class IsValidEmailDomainValidate implements ValidatorConstraintInterface {
    validate(email: string): Promise<boolean> | boolean {
        const userEmailDomain = email.substring(email.lastIndexOf("@") + 1)
        return ALLOWED_EMAILS_DOMAINS.includes(userEmailDomain)
    }
    defaultMessage?(): string {
        return `Signup with this email provider is currently unavailable. Please try a different email.`
    }
}
export function IsEmailDomainAllowed() {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            propertyName,
            target: object.constructor,
            validator: IsValidEmailDomainValidate
        })
    }
}