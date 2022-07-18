import { CreateDateColumn, Column } from "typeorm"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "typeorm/decorator/entity/Entity"

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
