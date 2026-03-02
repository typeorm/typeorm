import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { TableInheritance } from "../../../../../../src/decorator/entity/TableInheritance"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { OneToOne } from "../../../../../../src/decorator/relations/OneToOne"
import { JoinColumn } from "../../../../../../src/decorator/relations/JoinColumn"
import { BaseEntity } from "./BaseEntity"
import { Authorization } from "./Authorization"
import { Profile } from "./Profile"

/**
 * CTI root entity extending abstract base with eager + non-eager relations.
 * Mirrors Actor from the app (extends NameableEntity → AuthorizableEntity → BaseAlkemioEntity).
 */
@Entity()
@TableInheritance({ pattern: "CTI", column: { name: "type", type: String } })
export class Actor extends BaseEntity {
    @Column({ length: 128 })
    nameID: string

    @OneToOne(() => Authorization, {
        eager: true,
        cascade: true,
        onDelete: "SET NULL",
    })
    @JoinColumn()
    authorization: Authorization

    @OneToOne(() => Profile, {
        eager: false,
        cascade: true,
        onDelete: "SET NULL",
    })
    @JoinColumn()
    profile: Profile
}
