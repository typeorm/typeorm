import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { TableInheritance } from "../../../../../../src/decorator/entity/TableInheritance"
import { OneToMany } from "../../../../../../src/decorator/relations/OneToMany"
import { NameableEntity } from "./NameableEntity"
import { Credential } from "./Credential"

@Entity()
@TableInheritance({
    pattern: "CTI",
    column: { type: "varchar", name: "type" },
})
export class Actor extends NameableEntity {
    type: string

    @OneToMany(() => Credential, (c) => c.actor, {
        eager: false,
        cascade: true,
    })
    credentials: Credential[]
}
