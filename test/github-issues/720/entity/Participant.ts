import { Column, Entity, PrimaryColumn } from "@typeorm/core";

@Entity("participants")
export class Participant {

    @PrimaryColumn()
    order_id: number;

    @PrimaryColumn()
    distance: string;

    @Column()
    price?: string;

}
