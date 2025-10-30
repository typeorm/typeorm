import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "../../../../src"
import { Item } from "./item"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: true })
    name: string

    @Column()
    age: number

    @OneToMany(() => Item, (item) => item.owner)
    items: Item[]
}
