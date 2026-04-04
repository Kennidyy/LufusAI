import type {IUuidGenerator} from "./IUuidGenerator.ts"

export class UuidGenerator implements IUuidGenerator {
    generate(): string {
        return Bun.randomUUIDv7();
    }
}