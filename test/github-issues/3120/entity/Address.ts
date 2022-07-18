import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { Person } from "./Person"

@Entity()
export class Address {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    country: string

    @Column()
    city: string

    @Column()
    street: string

    @ManyToMany((type) => Person, (person) => person.addresses)
    people: Person[]
}
