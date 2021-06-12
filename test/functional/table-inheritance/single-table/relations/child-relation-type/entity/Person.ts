import {Column, Entity, OneToMany, PrimaryGeneratedColumn, TableInheritance} from "../../../../../../../src";
import {Data} from "./Data";

@Entity()
@TableInheritance({column: {name: "type", type: "varchar"}})
export class Person {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(() => Data, data => data.person)
    data: Data[];

}
