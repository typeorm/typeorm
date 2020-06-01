import {Column, Entity, PrimaryGeneratedColumn} from "../../../../src";

@Entity()
export class Counter {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("int")
    value: number;

}
