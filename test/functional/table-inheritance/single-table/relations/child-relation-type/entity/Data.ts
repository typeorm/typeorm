import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "../../../../../../../src";
import {Person} from "./Person";

@Entity("data")
export abstract class Data {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToOne(() => Person, person => person.data)
    person: Person;

}
