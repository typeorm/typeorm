import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"

@Entity()
export class Question {
    @PrimaryGeneratedColumn({ type: "smallint" })
    id: number

    @Column()
    name: string
}
