import { User } from "../../../domain/entities/User.ts";
import { ID } from "../../../domain/value-objects/ID.ts";
import { Email } from "../../../domain/value-objects/Email.ts";
import { Password } from "../../../domain/value-objects/Password.ts";
import { Name } from "../../../domain/value-objects/Name.ts";
import type { UserTable } from "../../../../database/schema.ts";

export class UserMapper {
    static toDomain(table: UserTable): User {
        const id = ID.restore(table.id);
        const email = Email.restore(table.email);
        const password = Password.fromHashed(table.password);
        const name = Name.restore(table.name);
        
        return User.restore(
            id,
            email,
            password,
            name,
            table.createdAt,
            table.updatedAt
        );
    }

    static toTable(user: User): Omit<UserTable, "createdAt" | "updatedAt"> {
        return {
            id: user.id.value,
            email: user.email.value,
            password: user.password.value,
            name: user.name.value
        };
    }
}
