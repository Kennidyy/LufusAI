export class AppConfig {
    private static instance: AppConfig;

    readonly databaseUrl: string;
    readonly logLevel: string;
    readonly passwordPepper: string;

    private constructor() {
        this.databaseUrl = this.requireEnv("DATABASE_URL");
        this.logLevel = process.env.LOG_LEVEL || "INFO";
        this.passwordPepper = this.requireEnv("PASSWORD_PEPPER");
    }

    private requireEnv(key: string): string {
        const value = process.env[key];
        if (!value) {
            throw new Error(`Environment variable ${key} is required`);
        }
        return value;
    }

    static getInstance(): AppConfig {
        if (!AppConfig.instance) {
            AppConfig.instance = new AppConfig();
        }
        return AppConfig.instance;
    }
}

export const config = AppConfig.getInstance();
