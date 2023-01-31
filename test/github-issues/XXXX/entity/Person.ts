import { Column, Entity, OneToMany } from "../../../../src";
import { Address } from "./Address";
import { BaseEntityAbstract } from "./BaseEntity";
import { Car } from "./Car";
// import { Company } from "./Company";

@Entity()
export class Person extends BaseEntityAbstract {

    @Column()
    name: string;

    @OneToMany(
        () => Car,
        x => x.person,
    )
    cars: Person[];

    @OneToMany(
        () => Address,
        x => x.person,
    )
    public addresses: Array<Address>;
}
