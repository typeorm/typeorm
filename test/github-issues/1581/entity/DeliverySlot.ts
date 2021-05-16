import {Column, Entity, PrimaryGeneratedColumn} from "../../../../src";

@Entity()
export class DeliverySlot {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}
