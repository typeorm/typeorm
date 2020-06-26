import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class DeliverySlot {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}
