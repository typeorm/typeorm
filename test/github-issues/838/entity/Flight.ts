import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"

@Entity()
export class Flight {
    constructor(id: number, date: Date) {
        this.id = id
        this.date = date
    }

    @PrimaryGeneratedColumn()
    id: number

    @Column("timestamp with time zone")
    date: Date
}
