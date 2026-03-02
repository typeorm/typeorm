import { OneToOne } from "../../../../../../src/decorator/relations/OneToOne"
import { JoinColumn } from "../../../../../../src/decorator/relations/JoinColumn"
import { BaseAlkemioEntity } from "./BaseAlkemioEntity"
import { AuthorizationPolicy } from "./AuthorizationPolicy"

/**
 * Mirrors the Alkemio AuthorizableEntity: adds an eager OneToOne
 * relation to AuthorizationPolicy.
 */
export abstract class AuthorizableEntity extends BaseAlkemioEntity {
    @OneToOne(() => AuthorizationPolicy, {
        eager: true,
        cascade: true,
        onDelete: "SET NULL",
    })
    @JoinColumn()
    authorization: AuthorizationPolicy
}
