import { ID } from "../value-objects/ID.ts";
import { Email } from "../value-objects/Email.ts";
import { Password } from "../value-objects/Password.ts";
import { Name } from "../value-objects/Name.ts";

export class User {
    readonly id: ID;
    readonly email: Email;
    readonly password: Password;
    readonly name: Name;
    readonly createdAt: Date;
    readonly updatedAt: Date;

    private constructor(
        id: ID,
        email: Email,
        password: Password,
        name: Name,
        createdAt: Date,
        updatedAt: Date
    ) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.name = name;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    static create(
        id: ID,
        email: Email,
        password: Password,
        name: Name
    ): User {
        const now = new Date();
        return new User(id, email, password, name, now, now);
    }

    static restore(
        id: ID,
        email: Email,
        password: Password,
        name: Name,
        createdAt: Date,
        updatedAt: Date
    ): User {
        return new User(id, email, password, name, createdAt, updatedAt);
    }
}
