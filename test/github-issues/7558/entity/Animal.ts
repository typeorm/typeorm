import {
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    TableInheritance,
} from "../../../../src"

import { PersonEntity } from "./Person"

@Entity("animal")
@TableInheritance({ column: { type: "varchar", name: "type" } })
export class AnimalEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "varchar" })
    name: string

    @ManyToOne(() => PersonEntity, ({ pets }) => pets, {
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    })
    person: PersonEntity
}
