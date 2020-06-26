import { Column, Entity, PrimaryColumn } from "@typeorm/core";


@Entity()
export class Item {
    @PrimaryColumn()
    itemId: number;

    @Column()
    planId: number;
}
