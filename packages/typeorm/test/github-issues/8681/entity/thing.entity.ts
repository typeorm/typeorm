import {
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from "../../../../src"
import { Item } from "./item.entity"

@Entity()
export class Thing {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    name!: string

    @OneToMany(() => Item, (item) => item.thing)
    items!: Item[]
}
