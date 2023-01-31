import { Column, Entity, JoinColumn, ManyToOne } from "../../../../src";
import { BaseEntityAbstract } from "./BaseEntity";
import { Person } from "./Person";

@Entity()
export class Address extends BaseEntityAbstract {

    @Column()
    country: string;

    @Column({name: "userId" })
    userId: string;

    @ManyToOne(
        () => Person,
        x => x.addresses,
        { eager: true }
    )
    @JoinColumn({ name: "userId", referencedColumnName: "id"})
    person: Person;
}