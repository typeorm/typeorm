import {Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn} from "../../../../../src";
import {ContactPerson} from "./ContactPerson";

@Entity()
export class Business {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToMany(() => ContactPerson, contactPerson => contactPerson.businesses, { cascade: true })
    @JoinTable()
    contactPersons: ContactPerson[];

}
