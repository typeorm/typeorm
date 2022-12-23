import { Entity } from "../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column, OneToMany } from "../../../../src"
import { CompositeEntity } from "./CompositeEntity"

@Entity()
export class ReferencedEntityTwo {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @OneToMany(
        () => CompositeEntity,
        (composite) => composite.referencedEntityTwo,
    )
    composites: CompositeEntity[]

    @Column("int")
    num: number
}
