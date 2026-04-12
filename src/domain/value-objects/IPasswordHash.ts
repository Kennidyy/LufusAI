export interface IPasswordHash {
    hashPassword(input: string): Promise<string>;
    verify(plainText: string, hashed: string): Promise<boolean>;
}
