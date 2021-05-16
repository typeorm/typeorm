import {Column, Entity, PrimaryGeneratedColumn} from "../../../../src";

@Entity("Foo")
export class FooEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("datetime2", { precision: 0 })
    date: Date;
}