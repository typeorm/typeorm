/**
 * Arguments for ScopeMetadataArgs class.
 */
export interface ScopeMetadataArgs {

    /**
     * Class to which scope is applied.
     */
    readonly target: Object;

    /**
     * Class's property name to which scope is applied.
     */
    readonly propertyName: string;

    /**
     * Set the scope is default scope or not.
     */
    readonly global: boolean;

}
