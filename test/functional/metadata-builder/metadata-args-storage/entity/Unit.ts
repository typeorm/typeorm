import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"

export class Unit {
    @PrimaryGeneratedColumn()
    id: string

    @Column()
    type: string
}
