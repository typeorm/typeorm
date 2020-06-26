import { Column, Entity, PrimaryColumn } from "@typeorm/core";

@Entity()
export class PostBigInt {

    @PrimaryColumn()
    id: number;

    @Column()
    title: string;

    @Column("bigint", {
        unsigned: true
    })
    counter: string;

}
