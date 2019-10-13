import { EntityMetadata } from "../metadata/EntityMetadata";
/**
 */
export declare class Alias {
    type: "from" | "select" | "join" | "other";
    name: string;
    /**
     * Table on which this alias is applied.
     * Used only for aliases which select custom tables.
     */
    tablePath?: string;
    /**
     * If this alias is for sub query.
     */
    subQuery?: string;
    constructor(alias?: Alias);
    private _metadata?;
    readonly target: Function | string;
    readonly hasMetadata: boolean;
    metadata: EntityMetadata;
}
