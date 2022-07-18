import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class DeliverySlot {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}
