import { OneToOne } from "../../../../../../src/decorator/relations/OneToOne"
import { JoinColumn } from "../../../../../../src/decorator/relations/JoinColumn"
import { BaseAlkemioEntity } from "./BaseAlkemioEntity"
import { AuthPolicy } from "./AuthPolicy"

export abstract class AuthorizableEntity extends BaseAlkemioEntity {
    @OneToOne(() => AuthPolicy, {
        eager: true,
        cascade: true,
        onDelete: "SET NULL",
    })
    @JoinColumn()
    authorization: AuthPolicy
}
