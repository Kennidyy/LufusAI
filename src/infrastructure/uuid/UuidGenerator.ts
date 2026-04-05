import type { IUuidGenerator } from "../../domain/value-objects/IUuidGenerator.ts";

export class UuidGenerator implements IUuidGenerator {
    generate(): string {
        return Bun.randomUUIDv7();
    }
}
