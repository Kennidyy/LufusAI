import { Points } from "../value-objects/Points.ts";
import { ID } from "../value-objects/ID.ts";
import type { IUuidGenerator } from "../value-objects/IUuidGenerator.ts";

export class Wallet {
    readonly id: ID;
    readonly userId: ID;
    readonly points: Points;
    readonly createdAt: Date;
    readonly updatedAt: Date;

    private constructor(
        id: ID,
        userId: ID,
        points: Points,
        createdAt: Date,
        updatedAt: Date
    ) {
        this.id = id;
        this.userId = userId;
        this.points = points;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    static create(userId: ID, uuidGenerator: IUuidGenerator): Wallet {
        const id = ID.create(uuidGenerator);
        const points = Points.zero();
        const now = new Date();
        return new Wallet(id, userId, points, now, now);
    }

    static restore(
        id: ID,
        userId: ID,
        points: Points,
        createdAt: Date,
        updatedAt: Date
    ): Wallet {
        return new Wallet(id, userId, points, createdAt, updatedAt);
    }

    addPoints(amount: Points): Wallet {
        const newPoints = this.points.add(amount);
        return new Wallet(
            this.id,
            this.userId,
            newPoints,
            this.createdAt,
            new Date()
        );
    }

    subtractPoints(amount: Points): Wallet {
        const newPoints = this.points.subtract(amount);
        return new Wallet(
            this.id,
            this.userId,
            newPoints,
            this.createdAt,
            new Date()
        );
    }
}
