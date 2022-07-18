import { Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { Thing } from "./thing.entity"

@Entity()
export class Item {
    @PrimaryGeneratedColumn()
    id!: number

    @ManyToOne(() => Thing, (thing) => thing.items)
    thing!: Thing
}
