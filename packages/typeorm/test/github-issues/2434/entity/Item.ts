import { CreateDateColumn, Column } from "../../../../src"
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "../../../../src/decorator/entity/Entity"

@Entity("ITEM")
export class Item {
    @PrimaryGeneratedColumn("uuid")
    id: number

    @CreateDateColumn()
    date: Date

    @Column()
    itemName: string

    @Column({ nullable: true })
    itemDescription?: string
}
