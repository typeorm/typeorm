import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { OneToOne } from "typeorm/decorator/relations/OneToOne"
import { Person } from "./Person"

@Entity()
export class Passport {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    passportNumber: string

    @OneToOne((type) => Person, (person) => person.passport)
    owner: Person
}
