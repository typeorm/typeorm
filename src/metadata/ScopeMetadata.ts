import {EntityMetadata} from "./EntityMetadata";
import {ScopeMetadataArgs} from "../metadata-args/ScopeMetadataArgs";

/**
 * This metadata contains all information about table's scopes.
 */
export class ScopeMetadata {

    // ---------------------------------------------------------------------
    // Public Properties
    // ---------------------------------------------------------------------

    /**
     * Entity metadata of the class to which this scope is applied.
     */
    entityMetadata: EntityMetadata;

    /**
     * Target class to which metadata is applied.
     */
    target: Object;

    /**
     * Class's property name on which this scope is applied.
     */
    propertyName: string;

    /**
     * Set the scope is global scope or not.
     */
    global: boolean;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(options: {
        entityMetadata: EntityMetadata,
        args: ScopeMetadataArgs
    }) {
        this.entityMetadata = options.entityMetadata;

        this.target = options.args.target;
        this.propertyName = options.args.propertyName;
        this.global = options.args.global;
    }

    // ---------------------------------------------------------------------
    // Public Build Methods
    // ---------------------------------------------------------------------

    /**
     * Builds some depend scope properties.
     */
    build(): this {
        return this;
    }

}