import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"

@Entity()
export class Tournament {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ unique: true, length: 200 })
    name: string

    @Column()
    startDate: Date

    @Column()
    endDate: Date
}
