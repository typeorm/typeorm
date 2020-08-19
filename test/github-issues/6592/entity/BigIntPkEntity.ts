import {Column, Entity, PrimaryColumn} from "../../../../src";

@Entity()
export class BigIntPkEntity {

    @PrimaryColumn({type: "bigint"})
    id: number;

    @Column()
    name: string;

    @Column()
    quantity: number;
}
