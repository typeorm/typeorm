import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { TableInheritance } from "../../../../../../src/decorator/entity/TableInheritance"
import { OneToMany } from "../../../../../../src/decorator/relations/OneToMany"
import { NameableEntity } from "./NameableEntity"
import { Credential } from "./Credential"

/**
 * CTI root entity extending 3 levels of abstract base classes.
 * Mirrors the Alkemio Actor entity.
 *
 * Inheritance chain:
 *   BaseEntity (TypeORM Active Record) →
 *     BaseAlkemioEntity (uuid PK, dates, version) →
 *       AuthorizableEntity (eager authorization OneToOne) →
 *         NameableEntity (nameID, profile OneToOne) →
 *           Actor (CTI root)
 *
 * The `type` property is the discriminator column, auto-managed by
 * TypeORM. It is NOT decorated with @Column here — just a TS property.
 */
@Entity("actor")
@TableInheritance({ pattern: "CTI", column: { type: "varchar", name: "type" } })
export class Actor extends NameableEntity {
    type: string

    @OneToMany(() => Credential, (c) => c.actor, {
        eager: false,
        cascade: true,
    })
    credentials: Credential[]
}
