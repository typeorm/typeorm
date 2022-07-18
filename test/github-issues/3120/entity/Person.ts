import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn"
import { JoinTable } from "typeorm/decorator/relations/JoinTable"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { OneToOne } from "typeorm/decorator/relations/OneToOne"
import { Address } from "./Address"
import { Company } from "./Company"
import { Passport } from "./Passport"

@Entity()
export class Person {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToOne((type) => Company)
    company: Company

    @ManyToMany((type) => Address, (address) => address.people)
    @JoinTable()
    addresses: Address[]

    @OneToOne((type) => Passport, (passport) => passport.owner)
    @JoinColumn()
    passport: Passport
}
