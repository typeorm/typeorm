import {Column, Entity, Generated, PrimaryColumn} from "../../../../src";

@Entity()
export default class SomeEntityWithADate {
    @PrimaryColumn("integer")
    @Generated()
    id: number;

    @Column({type: "date"})
    someDateField: Date;
}
