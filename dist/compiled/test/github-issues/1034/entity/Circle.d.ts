import { User } from "./User";
export declare class Circle {
    /**
     * Circle's identifier
     */
    private id;
    /**
     * Circle's user
     *
     * You have to use getter and setter
     */
    private users;
    /**
     * Getter identifier
     *
     * @returns {number}
     */
    getId(): string;
    /**
     * Setter identifier
     *
     * @param id new identifier value
     */
    setId(id: string): void;
    /**
     * Setter user
     *
     * @param {Promise<User[]>} users
     */
    setUsers(users: Promise<User[]>): void;
    /**
     * Getter user
     *
     * @returns {User[]}
     */
    getUsers(): Promise<User[]>;
}
