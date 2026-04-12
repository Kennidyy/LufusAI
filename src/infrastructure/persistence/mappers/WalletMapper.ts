import { Wallet } from "../../../domain/entities/Wallet.ts";
import { ID } from "../../../domain/value-objects/ID.ts";
import { Points } from "../../../domain/value-objects/Points.ts";
import type { WalletTable } from "../../../../database/schema.ts";

export class WalletMapper {
    static toDomain(table: WalletTable): Wallet {
        const id = ID.restore(table.id);
        const userId = ID.restore(table.userId);
        const points = Points.restore(table.points);
        
        return Wallet.restore(
            id,
            userId,
            points,
            table.createdAt,
            table.updatedAt
        );
    }

    static toTable(wallet: Wallet): Omit<WalletTable, "createdAt" | "updatedAt"> {
        return {
            id: wallet.id.value,
            userId: wallet.userId.value,
            points: wallet.points.value
        };
    }
}
