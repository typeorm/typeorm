/**
 * Create a new ObjectID instance.
 *
 * @see http://mongodb.github.io/node-mongodb-native/2.1/api/ObjectID.html
 */
export declare class ObjectID {
    /**
     * The generation time of this ObjectId instance.
     */
    generationTime: number;

    constructor(s?: string | number);

    /**
     * Creates an ObjectID from a hex string representation of an ObjectID.
     */
    static createFromHexString(hexString: string): ObjectID;

    /**
     * Creates an ObjectID from a second based number, with the rest of the ObjectID zeroed out. Used for comparisons or sorting the ObjectID.
     */
    static createFromTime(time: number): ObjectID;

    /**
     * Checks if a value is a valid bson ObjectId.
     */
    static isValid(id: any): boolean;

    /**
     * Compares the equality of this ObjectID with otherID.
     */
    equals(otherID: ObjectID): boolean;

    /**
     * Generate a 12 byte id buffer used in ObjectID's.
     */
    generate(time?: number): string;

    /**
     * Returns the generation date (accurate up to the second) that this ID was generated.
     *
     */
    getTimestamp(): Date;

    /**
     * Return the ObjectID id as a 24 byte hex string representation.
     */
    toHexString(): string;

    /**
     * Get the timestamp and validate correctness.
     */
    toString(): string;
}
