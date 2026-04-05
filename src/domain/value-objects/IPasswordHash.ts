export interface IPasswordHash {
    hashPassword(input: string): Promise<string>;
}
