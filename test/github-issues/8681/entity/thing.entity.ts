import { Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { Item } from "./item.entity"

@Entity()
export class Thing {
    @PrimaryGeneratedColumn()
    id!: number

    @OneToMany(() => Item, (item) => item.thing)
    items!: Item[]
}
