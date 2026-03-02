/** @public */
export declare type BSONTypeTag =
    | "BSONRegExp"
    | "BSONSymbol"
    | "ObjectId"
    | "Binary"
    | "Decimal128"
    | "Double"
    | "Int32"
    | "Long"
    | "MaxKey"
    | "MinKey"
    | "Timestamp"
    | "Code"
    | "DBRef"

/** @public */
export declare abstract class BSONValue {
    /** @public */
    abstract get _bsontype(): BSONTypeTag
    /* Excluded from this release type: [BSON_VERSION_SYMBOL] */
    /**
     * @public
     * Prints a human-readable string of BSON value information
     * If invoked manually without node.js.inspect function, this will default to a modified JSON.stringify
     */
    abstract inspect(
        depth?: number,
        options?: unknown,
        inspect?: InspectFn,
    ): string
    /* Excluded from this release type: toExtendedJSON */
}

declare type InspectFn = (x: unknown, options?: unknown) => string

/**
 * A class representation of the BSON ObjectId type.
 * @public
 * @category BSONType
 */
export declare class ObjectId extends BSONValue {
    get _bsontype(): "ObjectId"
    /* Excluded from this release type: index */
    static cacheHexString: boolean
    /* Excluded from this release type: buffer */
    /** To generate a new ObjectId, use ObjectId() with no argument. */
    constructor()
    /**
     * Create ObjectId from a 24 character hex string.
     *
     * @param inputId - A 24 character hex string.
     */
    constructor(inputId: string)
    /**
     * Create ObjectId from the BSON ObjectId type.
     *
     * @param inputId - The BSON ObjectId type.
     */
    constructor(inputId: ObjectId)
    /**
     * Create ObjectId from the object type that has the toHexString method.
     *
     * @param inputId - The ObjectIdLike type.
     */
    constructor(inputId: ObjectIdLike)
    /**
     * Create ObjectId from a 12 byte binary Buffer.
     *
     * @param inputId - A 12 byte binary Buffer.
     */
    constructor(inputId: Uint8Array)
    /**
     * Implementation overload.
     *
     * @param inputId - All input types that are used in the constructor implementation.
     */
    constructor(inputId?: string | ObjectId | ObjectIdLike | Uint8Array)
    /**
     * The ObjectId bytes
     * @readonly
     */
    get id(): Uint8Array
    set id(value: Uint8Array)
    /* Excluded from this release type: validateHexString */
    /** Returns the ObjectId id as a 24 lowercase character hex string representation */
    toHexString(): string
    /* Excluded from this release type: getInc */
    /**
     * Generate a 12 byte id buffer used in ObjectId's
     *
     * @param time - pass in a second based timestamp.
     */
    static generate(time?: number): Uint8Array
    /**
     * Converts the id into a 24 character hex string for printing, unless encoding is provided.
     * @param encoding - hex or base64
     */
    toString(encoding?: "hex" | "base64"): string
    /** Converts to its JSON the 24 character hex string representation. */
    toJSON(): string
    /* Excluded from this release type: is */
    /**
     * Compares the equality of this ObjectId with `otherID`.
     *
     * @param otherId - ObjectId instance to compare against.
     */
    equals(
        otherId: string | ObjectId | ObjectIdLike | undefined | null,
    ): boolean
    /** Returns the generation date (accurate up to the second) that this ID was generated. */
    getTimestamp(): Date
    /* Excluded from this release type: createPk */
    /* Excluded from this release type: serializeInto */
    /**
     * Creates an ObjectId from a second based number, with the rest of the ObjectId zeroed out. Used for comparisons or sorting the ObjectId.
     *
     * @param time - an integer number representing a number of seconds.
     */
    static createFromTime(time: number): ObjectId
    /**
     * Creates an ObjectId from a hex string representation of an ObjectId.
     *
     * @param hexString - create a ObjectId from a passed in 24 character hexstring.
     */
    static createFromHexString(hexString: string): ObjectId
    /** Creates an ObjectId instance from a base64 string */
    static createFromBase64(base64: string): ObjectId
    /**
     * Checks if a value can be used to create a valid bson ObjectId
     * @param id - any JS value
     */
    static isValid(id: string | ObjectId | ObjectIdLike | Uint8Array): boolean
    /* Excluded from this release type: toExtendedJSON */
    /* Excluded from this release type: fromExtendedJSON */
    /* Excluded from this release type: isCached */
    /**
     * Converts to a string representation of this Id.
     *
     * @returns return the 24 character hex string representation.
     */
    inspect(depth?: number, options?: unknown, inspect?: InspectFn): string
}

/** @public */
export declare interface ObjectIdLike {
    id: string | Uint8Array
    __id?: string
    toHexString(): string
}
