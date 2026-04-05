import type { IEmailValidator } from "../../domain/value-objects/IEmailValidator.ts";
import validator from "validator";

export class EmailValidator implements IEmailValidator {
    isValid(input: string): boolean {
        return validator.isEmail(input);
    }
}
