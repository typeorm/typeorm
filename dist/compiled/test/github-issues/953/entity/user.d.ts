export declare type Role = "sa" | "user" | "admin" | "server";
export declare class User {
    id: number;
    username: string;
    password: string;
    phone: string;
    roles: Role[];
    lastLoginAt: Date;
}
