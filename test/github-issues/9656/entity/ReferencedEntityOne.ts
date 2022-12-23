import { Entity } from "../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column, OneToMany } from "../../../../src"
import { CompositeEntity } from "./CompositeEntity"

@Entity()
export class ReferencedEntityOne {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @OneToMany(
        () => CompositeEntity,
        (composite) => composite.referencedEntityOne,
        {
            cascade: true,
        },
    )
    composites: CompositeEntity[]

    @Column("text")
    name: string
}
