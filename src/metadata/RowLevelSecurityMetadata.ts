import { EntityMetadata } from "./EntityMetadata"
import { NamingStrategyInterface } from "../naming-strategy/NamingStrategyInterface"
import { RowLevelSecurityPolicyMetadataArgs } from "../metadata-args/RowLevelSecurityPolicyMetadataArgs"

/**
 * RowLevelSecurity metadata contains all information about table's row level security policies.
 */
export class RowLevelSecurityMetadata {
    // ---------------------------------------------------------------------
    // Public Properties
    // ---------------------------------------------------------------------

    /**
     * Entity metadata of the class to which this row level security policy is applied.
     */
    entityMetadata: EntityMetadata

    /**
     * Target class to which metadata is applied.
     */
    target?: Function | string

    /**
     * Type of the row level security policy.
     */
    type?: "permissive" | "restrictive"

    /**
     * User to which this row level security policy is applied.
     */
    role?: string

    /**
     * Check expression.
     */
    expression: string

    /**
     * User specified check constraint name.
     */
    givenName?: string

    /**
     * Final check constraint name.
     * If check constraint name was given by a user then it stores normalized (by naming strategy) givenName.
     * If check constraint name was not given then its generated.
     */
    name: string

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(options: {
        entityMetadata: EntityMetadata
        args?: RowLevelSecurityPolicyMetadataArgs
    }) {
        this.entityMetadata = options.entityMetadata

        if (options.args) {
            this.target = options.args.target
            this.type = options.args.type
            this.expression = options.args.expression
            this.role = options.args.role
            this.givenName = options.args.name
        }
    }

    // ---------------------------------------------------------------------
    // Public Build Methods
    // ---------------------------------------------------------------------

    /**
     * Builds some depend check constraint properties.
     * Must be called after all entity metadata's properties map, columns and relations are built.
     */
    build(namingStrategy: NamingStrategyInterface): this {
        this.name = this.givenName
            ? this.givenName
            : namingStrategy.rowLevelSecurityPolicyConstraintName(
                  this.entityMetadata.tableName,
                  this.expression,
              )
        return this
    }
}
