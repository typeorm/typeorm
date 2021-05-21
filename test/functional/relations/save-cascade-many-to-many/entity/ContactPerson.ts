import {Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn} from "../../../../../src";
import {Business} from "./Business";

@Entity()
export class ContactPerson {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToMany(() => Business, business => business.contactPersons)
    @JoinTable()
    businesses: Business[];

}
