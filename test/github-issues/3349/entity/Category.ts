import { PrimaryColumn } from "typeorm"
import { Column } from "typeorm"
import { Entity } from "typeorm"

@Entity()
export class Category {
    @PrimaryColumn()
    public id!: number

    @Column()
    public myField!: number
}
