import { Entity } from "../../../../src/decorator/entity/Entity"
import { Column, ManyToOne, PrimaryColumn } from "../../../../src"
import { ReferencedEntityOne } from "./ReferencedEntityOne"
import { ReferencedEntityTwo } from "./ReferencedEntityTwo"

@Entity()
export class CompositeEntity {
    @ManyToOne(() => ReferencedEntityOne, (one) => one.composites)
    referencedEntityOne: ReferencedEntityOne

    @PrimaryColumn("uuid")
    referencedEntityOneId: string

    @ManyToOne(() => ReferencedEntityTwo, (one) => one.composites)
    referencedEntityTwo: ReferencedEntityTwo

    @PrimaryColumn("uuid")
    referencedEntityTwoId: string

    @Column("text")
    description: string
}
