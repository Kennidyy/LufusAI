import type {IUuidGenerator} from "./IUuidGenerator"

export class UuidGenerator implements IUuidGenerator {
    generate(): string {
        return Bun.randomUUIDv7();
    }
}