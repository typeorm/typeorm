import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { Duration } from "./Duration"

@Entity()
export class Race {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column((type) => Duration)
    duration: Duration
}
