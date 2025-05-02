/**
 * Arguments for RowLevelSecurityPolicy class.
 */
export interface RowLevelSecurityPolicyMetadataArgs {
    /**
     * Class to which the policy is applied is applied.
     */
    target: Function | string

    /**
     * Role to which the policy is applied (by default it's applied to public role)
     */
    role?: string

    /**
     * policy expression.
     */
    expression: string

    /**
     * Type of the row level security policy.
     */
    type?: "permissive" | "restrictive"

    /**
     * User specified name.
     */
    name?: string
}
