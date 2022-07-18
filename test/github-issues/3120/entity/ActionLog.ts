import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn"
import { JoinTable } from "typeorm/decorator/relations/JoinTable"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { OneToOne } from "typeorm/decorator/relations/OneToOne"
import { ActionDetails } from "./ActionDetails"
import { Address } from "./Address"
import { Person } from "./Person"

@Entity()
export class ActionLog {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    date: Date

    @Column()
    action: string

    @ManyToOne((type) => Person, {
        createForeignKeyConstraints: false,
    })
    person: Person

    @ManyToMany((type) => Address, {
        createForeignKeyConstraints: false,
    })
    @JoinTable()
    addresses: Address[]

    @OneToOne((type) => ActionDetails, {
        createForeignKeyConstraints: false,
    })
    @JoinColumn()
    actionDetails: ActionDetails
}
