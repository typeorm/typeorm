import { Circle } from "./Circle";
export declare class User {
    /**
     * User's identifier
     */
    private id;
    private circles;
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
     * Getter circles
     *
     * @returns {Circle[]}
     */
    getCircles(): Promise<Circle[]>;
    /**
     * Setter circle
     *
     * @param circles new circle value
     */
    setCircles(circles: Promise<Circle[]>): void;
}
