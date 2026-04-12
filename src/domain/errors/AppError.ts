export class AppError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly statusCode: number = 500,
        public readonly isOperational: boolean = true
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string, identifier?: string) {
        const message = identifier 
            ? `${resource} with id '${identifier}' not found`
            : `${resource} not found`;
        super(message, "NOT_FOUND", 404);
    }
}

export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, "VALIDATION_ERROR", 400);
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, "CONFLICT", 409);
    }
}

export class DomainError extends AppError {
    constructor(message: string) {
        super(message, "DOMAIN_ERROR", 422);
    }
}
