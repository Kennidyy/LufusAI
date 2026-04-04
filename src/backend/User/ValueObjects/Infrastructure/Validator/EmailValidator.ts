import type {IEmailValidator} from "./IEmailValidator.ts";
import validator from "validator"

export class EmailValidator implements IEmailValidator {

    isValid(input: string): boolean {
        return validator.isEmail(input)
    }
}