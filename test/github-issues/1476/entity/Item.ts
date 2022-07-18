import { Entity, PrimaryColumn, Column } from "typeorm/index"

@Entity()
export class Item {
    @PrimaryColumn()
    itemId: number

    @Column()
    planId: number
}
